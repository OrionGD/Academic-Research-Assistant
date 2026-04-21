import { Request, Response } from 'express';
import { PLAN_CONFIG } from '../config/razorpay';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  activateSubscription,
  syncSubscriptionFromRazorpay,
} from '../services/razorpayService';
import { getUserUsageSummary, resetMonthlyUsage } from '../services/usageService';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── POST /api/billing/order ──────────────────────────────────────────────────
// [PLACEHOLDER] Returns mock order data immediately
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { planTier, interval } = req.body as { 
      planTier: 'BASIC' | 'STANDARD' | 'PRO'; 
      interval: 'MONTHLY' | 'YEARLY' 
    };

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!planTier || !interval) return res.status(400).json({ error: 'planTier and interval are required' });
    
    const validTiers = ['BASIC', 'STANDARD', 'PRO'];
    if (!validTiers.includes(planTier)) return res.status(400).json({ error: 'Invalid planTier' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const planConf = PLAN_CONFIG[planTier as keyof typeof PLAN_CONFIG];
    const amountInr = interval === 'YEARLY' ? planConf.priceAnnualInr : planConf.priceMonthlyInr;

    // Mock order data
    const orderData = {
      orderId: `order_mock_${Date.now()}`,
      amount: amountInr * 100,
      currency: 'INR',
      keyId: 'rzp_test_placeholder',
    };

    await AuditLog.create({
      userId,
      userEmail: user.email,
      action: 'checkout_initiated',
      resource: 'subscription',
      details: { planTier, interval, amountInr, mode: 'placeholder' },
      ip: req.ip,
    });

    res.json({
      ...orderData,
      planTier,
      interval,
      prefill: {
        name: user.name || '',
        email: user.email,
      },
    });
  } catch (error: any) {
    logger.error('[Billing] Placeholder order creation error:', error);
    res.status(500).json({ error: 'Failed to initiate mock checkout' });
  }
};

// ─── POST /api/billing/verify ─────────────────────────────────────────────────
// [PLACEHOLDER] Immediately activates subscription without signature check
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { planTier, interval } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // In placeholder mode, we just activate it
    await activateSubscription(
      user,
      `pay_mock_${Date.now()}`,
      `order_mock_${Date.now()}`,
      planTier as any,
      interval === 'YEARLY' ? 'year' : 'month' // Backend still uses lowercase internally for intervals often, but I'll stick to what activateSubscription expects
    );

    await AuditLog.create({
      userId,
      userEmail: user.email,
      action: 'subscription_activated',
      resource: 'subscription',
      details: { planTier, interval, mode: 'placeholder' },
      ip: req.ip,
    });

    logger.info(`[Billing] Placeholder upgrade: user ${user.email} → ${planTier}`);
    res.json({ success: true, planTier, redirectUrl: `${FRONTEND_URL}/billing?success=true` });
  } catch (error: any) {
    logger.error('[Billing] Mock verify error:', error);
    res.status(500).json({ error: 'Placeholder payment verification failed' });
  }
};

// ─── GET /api/billing/subscription ──────────────────────────────────────────
export const getSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId).select(
      'planTier subscriptionStatus currentPeriodEnd cancelAtPeriodEnd razorpaySubscriptionId monthlyUploads monthlyQueries storageUsedMb'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sub = user.razorpaySubscriptionId
      ? await Subscription.findOne({ razorpaySubscriptionId: user.razorpaySubscriptionId })
      : null;

    res.json({
      planTier: user.planTier,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      billingInterval: sub?.billingInterval || null,
      amountInr: sub?.amountInr || 0,
    });
  } catch (error: any) {
    logger.error('[Billing] Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// ─── GET /api/billing/usage ──────────────────────────────────────────────────
export const getUsage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const summary = await getUserUsageSummary(userId);
    res.json(summary);
  } catch (error: any) {
    logger.error('[Billing] Usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
};

// ─── GET /api/billing/plans ──────────────────────────────────────────────────
export const getPlans = async (_req: Request, res: Response) => {
  res.json(PLAN_CONFIG);
};

// ─── POST /api/billing/webhook ── (raw body, Razorpay signature) ─────────────
export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing Razorpay signature header' });
  }

  const isValid = verifyWebhookSignature(req.body as Buffer, signature);
  if (!isValid) {
    logger.warn('[Razorpay Webhook] Signature verification failed');
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }

  let event: any;
  try {
    event = JSON.parse((req.body as Buffer).toString());
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  logger.info(`[Razorpay Webhook] Event: ${event.event}`);

  try {
    await syncSubscriptionFromRazorpay(event);

    // Reset monthly usage on successful payment
    if (event.event === 'payment.captured') {
      const userId = event.payload?.payment?.entity?.notes?.userId;
      if (userId) {
        await resetMonthlyUsage(userId);
        logger.info(`[Webhook] Reset monthly usage for user ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('[Razorpay Webhook] Processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
