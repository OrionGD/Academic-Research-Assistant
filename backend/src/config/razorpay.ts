import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_REPLACE_ME') {
  console.warn('[Razorpay] RAZORPAY_KEY_ID not set — billing features disabled');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ─── Plan Limits ────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  FREE: {
    maxMonthlyUploads: 5,
    maxStorageMb: 50,
    maxMonthlyQueries: 20,
    apiAccess: false,
    maxApiKeys: 0,
    priority: 0,
  },
  BASIC: {
    maxMonthlyUploads: 50,
    maxStorageMb: 500,
    maxMonthlyQueries: 200,
    apiAccess: true,
    maxApiKeys: 2,
    priority: 1,
  },
  STANDARD: {
    maxMonthlyUploads: 200,
    maxStorageMb: 5000,
    maxMonthlyQueries: 1000,
    apiAccess: true,
    maxApiKeys: 3,
    priority: 2,
  },
  PRO: {
    maxMonthlyUploads: -1,   // -1 means unlimited
    maxStorageMb: -1,
    maxMonthlyQueries: -1,
    apiAccess: true,
    maxApiKeys: 5,
    priority: 3,
  },
} as const;

export type PlanTierKey = keyof typeof PLAN_LIMITS;

// ─── Plan Config (display + Razorpay Plan IDs) ──────────────────────────────
export const PLAN_CONFIG = {
  FREE: {
    label: 'Free',
    priceMonthlyInr: 0,
    priceAnnualInr: 0,
    razorpayPlanIdMonthly: '',
    razorpayPlanIdAnnual: '',
  },
  BASIC: {
    label: 'Basic',
    priceMonthlyInr: 499,
    priceAnnualInr: 4999,
    razorpayPlanIdMonthly: 'placeholder_basic_mo',
    razorpayPlanIdAnnual: 'placeholder_basic_yr',
  },
  STANDARD: {
    label: 'Standard',
    priceMonthlyInr: 1499,
    priceAnnualInr: 14999,
    razorpayPlanIdMonthly: 'placeholder_standard_mo',
    razorpayPlanIdAnnual: 'placeholder_standard_yr',
  },
  PRO: {
    label: 'Pro',
    priceMonthlyInr: 2999,
    priceAnnualInr: 29999,
    razorpayPlanIdMonthly: 'placeholder_pro_mo',
    razorpayPlanIdAnnual: 'placeholder_pro_yr',
  },
} as const;

/** Maps a Razorpay Plan ID → plan tier */
export function getPlanTierFromPlanId(planId: string): PlanTierKey {
  for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
    if (
      config.razorpayPlanIdMonthly === planId ||
      config.razorpayPlanIdAnnual === planId
    ) {
      return tier as PlanTierKey;
    }
  }
  return 'FREE';
}
