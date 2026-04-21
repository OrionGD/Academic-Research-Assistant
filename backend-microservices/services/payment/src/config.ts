import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: process.env.PORT || 5003,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://aras_rag:aras_rag192607@aras.jnqzklv.mongodb.net/aras_payment?appName=ARAS',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  pricing: {
    pro: {
      monthly: Number(process.env.PRICE_PRO_MONTHLY) || 1499,
      annual: Number(process.env.PRICE_PRO_ANNUAL) || 14999,
    },
    enterprise: {
      monthly: Number(process.env.PRICE_ENTERPRISE_MONTHLY) || 7999,
      annual: Number(process.env.PRICE_ENTERPRISE_ANNUAL) || 79999,
    },
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export type PlanType = 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export const getPrice = (plan: PlanType, cycle: BillingCycle): number => {
  return config.pricing[plan][cycle];
};
