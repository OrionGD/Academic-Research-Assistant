import crypto from 'crypto';
import { razorpay, getPlanTierFromPlanId, PLAN_CONFIG } from '../config/razorpay';
import { User, IUser } from '../models/User';
import { Subscription } from '../models/Subscription';
import { logger } from '../utils/logger';

/** Amount in paise (INR × 100) for Razorpay */
function toRazorpayAmount(inr: number): number {
  return inr * 100;
}

/**
 * Create a Razorpay Order for a one-time or first-time payment.
 * Returns the order details the frontend needs to open the checkout modal.
 */
export async function createRazorpayOrder(
  amountInr: number,
  planTier: string,
  interval: 'month' | 'year',
  userId: string
): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
  const order = await (razorpay.orders as any).create({
    amount: toRazorpayAmount(amountInr),
    currency: 'INR',
    receipt: `aras_${userId}_${Date.now()}`,
    notes: {
      userId,
      planTier,
      interval,
    },
  });

  logger.info(`[Razorpay] Created order ${order.id} for user ${userId} — ₹${amountInr}`);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID || '',
  };
}

/**
 * Verify the Razorpay payment signature after successful checkout.
 * Returns true if signature is valid.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Verify a Razorpay webhook signature.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Activate or update a user's subscription after verified payment.
 * Creates/updates the Subscription document and updates the User.
 */
export async function activateSubscription(
  user: IUser,
  paymentId: string,
  orderId: string,
  planTier: 'BASIC' | 'STANDARD' | 'PRO',
  interval: 'month' | 'year'
): Promise<void> {
  const planConf = PLAN_CONFIG[planTier];
  const amountInr = interval === 'year' ? planConf.priceAnnualInr : planConf.priceMonthlyInr;

  const now = new Date();
  const durationMs = interval === 'year' ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
  const periodEnd = new Date(now.getTime() + durationMs);

  // Update user record
  user.planTier = planTier;
  user.plan = planTier;
  user.razorpaySubscriptionId = paymentId; // store payment ID as subscription ref
  user.subscriptionStatus = 'active';
  user.currentPeriodEnd = periodEnd;
  user.cancelAtPeriodEnd = false;
  await user.save();

  // Upsert Subscription document
  await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: paymentId },
    {
      userId: user._id,
      razorpaySubscriptionId: paymentId,
      razorpayOrderId: orderId,
      razorpayPlanId: `${planTier}_${interval}`,
      planTier,
      billingInterval: interval,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      amountInr,
    },
    { upsert: true, new: true }
  );

  logger.info(`[Razorpay] Activated subscription for user ${user.email} → plan ${planTier} (${interval})`);
}

/**
 * Handle a Razorpay webhook event and sync the subscription state.
 */
export async function syncSubscriptionFromRazorpay(event: any): Promise<void> {
  const payload = event.payload?.subscription?.entity || event.payload?.payment?.entity;
  if (!payload) return;

  const notes = payload.notes || {};
  const userId = notes.userId;
  if (!userId) {
    logger.warn(`[Razorpay Webhook] No userId in notes for event ${event.event}`);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    logger.warn(`[Razorpay Webhook] User ${userId} not found`);
    return;
  }

  switch (event.event) {
    case 'subscription.activated':
    case 'payment.captured': {
      const planId = payload.plan_id || notes.planId || '';
      const planTier = getPlanTierFromPlanId(planId) as 'BASIC' | 'STANDARD' | 'PRO' | 'FREE';
      const interval = (notes.interval as 'month' | 'year') || 'month';
      if (planTier !== 'FREE') {
        await activateSubscription(user, payload.id, payload.order_id || '', planTier as any, interval);
      }
      break;
    }

    case 'subscription.cancelled':
    case 'subscription.expired': {
      user.planTier = 'FREE';
      user.plan = 'FREE';
      user.subscriptionStatus = 'canceled';
      await user.save();
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: payload.id },
        { status: 'canceled', canceledAt: new Date() }
      );
      logger.info(`[Razorpay Webhook] Cancelled subscription for user ${user.email}`);
      break;
    }

    case 'subscription.pending':
    case 'payment.failed': {
      user.subscriptionStatus = 'past_due';
      await user.save();
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: payload.id },
        { status: 'past_due' }
      );
      logger.info(`[Razorpay Webhook] Payment failed for user ${user.email}`);
      break;
    }

    default:
      logger.debug(`[Razorpay Webhook] Unhandled event: ${event.event}`);
  }
}
