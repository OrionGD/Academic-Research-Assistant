import { Router, raw } from 'express';
import {
  createOrder,
  verifyPayment,
  getSubscription,
  getUsage,
  getPlans,
  handleWebhook,
} from '../controllers/billingController';

const router = Router();

// Public — no auth needed for plan listing
router.get('/plans', getPlans);

// Razorpay webhook — MUST use raw body parser for signature verification
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  handleWebhook
);

// Protected routes (authMiddleware applied globally in server.ts)

// GET /api/billing  — returns current user's subscription summary
router.get('/', getSubscription);

router.post('/order', createOrder);       // Create Razorpay order → frontend opens modal
router.post('/verify', verifyPayment);    // Verify payment signature → activate subscription
router.get('/subscription', getSubscription);
router.get('/usage', getUsage);

export default router;
