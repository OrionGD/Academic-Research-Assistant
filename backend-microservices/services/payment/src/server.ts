import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import winston from 'winston';
import dayjs from 'dayjs';
import { config, getPrice, PlanType, BillingCycle } from './config';
import { Payment } from './models/Payment';
import { FailedEvent } from './models/FailedEvent';
import { EventBus } from '../../../common/src/events';
import { EventType } from '../../../common/src/types';
import { authorize } from '../../../common/src/middleware';

// 1. Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

const app = express();
const eventBus = new EventBus('payment-service');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

app.use(cors());

// Capture Raw Body for Webhook Verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl === '/payment/webhook') {
      req.rawBody = buf.toString();
    }
  }
}));

// 🧪 Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'payment-service', status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * HELPER: Publish Event with Fallback
 */
const publishWithFallback = async (type: EventType, payload: any) => {
  try {
    await eventBus.publish(type, payload);
    logger.info('EVENT_PUBLISHED', { type, userId: payload.userId });
  } catch (err: any) {
    logger.error('EVENT_PUBLISH_FAILED', { type, error: err.message, payload });
    await FailedEvent.create({
      type,
      payload,
      status: 'pending',
      lastError: err.message
    });
  }
};

/**
 * 🛠️ BACKGROUND RETRY WORKER
 */
setInterval(async () => {
  const pendingEvents = await FailedEvent.find({ status: 'pending' }).limit(10);
  
  if (pendingEvents.length > 0) {
    logger.info('RETRY_WORKER_START', { count: pendingEvents.length });
  }

  for (const event of pendingEvents) {
    try {
      await eventBus.publish(event.type as EventType, event.payload);
      event.status = 'completed';
      await event.save();
      logger.info('RETRY_SUCCESS', { eventId: event._id, type: event.type });
    } catch (err: any) {
      event.retryCount += 1;
      event.lastError = err.message;
      if (event.retryCount > 5) {
        event.status = 'dead';
        logger.error('RETRY_GIVING_UP', { eventId: event._id, type: event.type });
      }
      await event.save();
    }
  }
}, 30000); // Check every 30 seconds

/**
 * CREATE ORDER
 */
app.post('/payment/create-order', authorize, async (req: any, res) => {
  try {
    const { plan, cycle } = req.body;
    const userId = req.user.id;

    if (!plan || !cycle) {
      return res.status(400).json({ error: 'Plan and cycle are required' });
    }

    const amountInRupees = getPrice(plan as PlanType, cycle as BillingCycle);
    const amountInPaise = amountInRupees * 100;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${userId}`,
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId,
      orderId: order.id,
      amount: amountInPaise,
      plan,
      billingCycle: cycle,
      status: 'created',
      events: [{ type: 'ORDER_CREATED', timestamp: new Date(), metadata: { amount: amountInPaise, cycle } }]
    });

    logger.info('PAYMENT_ORDER_CREATED', { orderId: order.id, userId, plan, cycle });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: config.razorpay.keyId,
    });
  } catch (err: any) {
    logger.error('PAYMENT_ORDER_ERROR', { error: err.message });
    res.status(500).json({ error: 'Order creation failed' });
  }
});

/**
 * VERIFY PAYMENT
 */
app.post('/payment/verify', authorize, async (req: any, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn('INVALID_SIGNATURE', { orderId: razorpay_order_id, userId });
      return res.status(400).json({ error: 'Invalid verification signature' });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status === 'paid') {
      return res.json({ status: 'success', message: 'Already processed' });
    }

    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'paid';
    payment.lastPaymentAt = new Date();
    payment.events.push({ type: 'PAYMENT_VERIFIED', timestamp: new Date(), metadata: { paymentId: razorpay_payment_id } });
    await payment.save();

    logger.info('PAYMENT_SUCCESS', { userId, orderId: razorpay_order_id, paymentId: razorpay_payment_id, plan: payment.plan });

    await publishWithFallback(EventType.USER_UPGRADED, {
      userId,
      plan: 'premium',
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      billingCycle: payment.billingCycle,
    });

    res.json({ status: 'success' });
  } catch (err: any) {
    logger.error('VERIFICATION_ERROR', { error: err.message });
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * WEBHOOK
 */
app.post('/payment/webhook', async (req: any, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    
    // VERIFY WEBHOOK SIGNATURE USING RAW BODY
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.error('WEBHOOK_SIGNATURE_INVALID');
      return res.status(400).send('Invalid');
    }

    const { event, payload } = req.body;
    logger.info('WEBHOOK_RECEIVED', { event });

    if (event === 'payment.captured') {
      const p = payload.payment.entity;
      const orderId = p.order_id;
      
      const payment = await Payment.findOne({ orderId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.paymentId = p.id;
        payment.lastPaymentAt = new Date();
        payment.events.push({ type: 'WEBHOOK_PAYMENT_CAPTURED', timestamp: new Date(), metadata: { paymentId: p.id } });
        await payment.save();
        
        await publishWithFallback(EventType.USER_UPGRADED, {
          userId: payment.userId,
          plan: 'premium',
          transactionId: p.id,
          orderId,
          billingCycle: payment.billingCycle
        });
        logger.info('WEBHOOK_UPGRADE_COMPLETE', { orderId, userId: payment.userId });
      }
    }

    res.status(200).send('OK');
  } catch (err: any) {
    logger.error('WEBHOOK_ERROR', { error: err.message });
    res.status(500).send('Error');
  }
});

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('CONNECTED_TO_MONGODB', { db: 'aras_payment' });
    
    app.listen(config.port, () => {
      logger.info('SERVER_STARTED', { port: config.port });
    });
  } catch (err) {
    logger.error('STARTUP_FAILURE', { error: err });
    process.exit(1);
  }
};

start();
