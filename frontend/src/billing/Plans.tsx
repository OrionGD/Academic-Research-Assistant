import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlans, verifyPayment } from '../shared/services/api/billingService';
import { toast } from 'sonner';
import { PlanBadge } from '../shared/components/PlanBadge';
import { motion } from 'motion/react';
import { Check, X, Sparkles, Rocket, Gem, IndianRupee, CheckCircle2 } from 'lucide-react';

type PlanTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
type BillingInterval = 'MONTHLY' | 'YEARLY';

interface PlanConfig {
  tier: PlanTier;
  name: string;
  emoji: string;
  tagline: string;

  pricing: {
    monthlyInr: number;
    yearlyInr: number;
    yearlyMonthlyEquivalent: number;
  };

  limits: {
    documentUploadsPerMonth: number | 'UNLIMITED';
    storageMb: number | 'UNLIMITED';
    aiQueriesPerMonth: number | 'UNLIMITED';
    aiApiKeysAllowed: number;
  };

  features: string[];
  unavailableFeatures: string[];

  cta: string;
  recommended: boolean;
  badge?: string;
}

export const PLANS: PlanConfig[] = [
  {
    tier: 'FREE',
    name: 'Free',
    emoji: '👤',
    tagline: 'Standard research access',

    pricing: {
      monthlyInr: 0,
      yearlyInr: 0,
      yearlyMonthlyEquivalent: 0,
    },

    limits: {
      documentUploadsPerMonth: 5,
      storageMb: 50,
      aiQueriesPerMonth: 20,
      aiApiKeysAllowed: 0,
    },

    features: [
      '100 credits / month (Guest/Free)',
      'Basic semantic search',
      'Community support',
      'Standard research access',
    ],

    unavailableFeatures: [
      'Document comparison',
      'AI Analysis Suite',
      'AI API access',
      'Priority processing',
    ],

    cta: 'Current Plan',
    recommended: false,
  },

  {
    tier: 'BASIC',
    name: 'Basic',
    emoji: '⭐',
    tagline: 'For casual researchers',

    pricing: {
      monthlyInr: 499,
      yearlyInr: 4999,
      yearlyMonthlyEquivalent: 416,
    },

    limits: {
      documentUploadsPerMonth: 50,
      storageMb: 500,
      aiQueriesPerMonth: 200,
      aiApiKeysAllowed: 2,
    },

    features: [
      '1,000 credits / month',
      'Advanced semantic search',
      'Document summaries',
      'AI API access (2 keys)',
      'Standard research tools',
    ],

    unavailableFeatures: [
      'Document comparison',
      'Priority processing',
    ],

    cta: 'Upgrade to Basic',
    recommended: false,
  },

  {
    tier: 'STANDARD',
    name: 'Standard',
    emoji: '🚀',
    tagline: 'For active professionals',

    pricing: {
      monthlyInr: 1499,
      yearlyInr: 14999,
      yearlyMonthlyEquivalent: 1250,
    },

    limits: {
      documentUploadsPerMonth: 200,
      storageMb: 5000,
      aiQueriesPerMonth: 1000,
      aiApiKeysAllowed: 3, 
    },

    features: [
      '5,000 credits / month',
      'Document comparison',
      'AI Analysis Suite',
      'AI API access (3 keys)', 
      'Priority support',
      'Full research power',
    ],

    unavailableFeatures: [],

    cta: 'Upgrade to Standard',
    recommended: true,
    badge: 'Most Popular',
  },

  {
    tier: 'PRO',
    name: 'Pro',
    emoji: '💎',
    tagline: 'Unrestricted research power',

    pricing: {
      monthlyInr: 2999,
      yearlyInr: 29999,
      yearlyMonthlyEquivalent: 2500,
    },

    limits: {
      documentUploadsPerMonth: 'UNLIMITED',
      storageMb: 'UNLIMITED',
      aiQueriesPerMonth: 'UNLIMITED',
      aiApiKeysAllowed: 5, 
    },

    features: [
      'Unlimited credits / month',
      'Unlimited storage',
      'Priority processing',
      'Dedicated support',
      'Custom integrations',
      'AI API access (5 keys)', 
      'Full analysis suite',
    ],

    unavailableFeatures: [],

    cta: 'Upgrade to Pro',
    recommended: false,
    badge: 'Best Value',
  },
];

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [interval, setInterval] = useState<BillingInterval>('MONTHLY');
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => {});

    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — no charges made.');
    }
  }, []);

  const currentTier = (user?.planTier as PlanTier) || 'FREE';

  const handleUpgrade = async (tier: PlanTier) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (tier === 'FREE') return;

    try {
      setLoadingTier(tier);
      toast.info(`Simulating payment for ${tier}...`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await verifyPayment({
        planTier: tier,
        interval,
        orderId: `mock_order_${Date.now()}`,
        paymentId: `mock_pay_${Date.now()}`,
        signature: 'placeholder_sig'
      });

      if (result.success) {
        toast.success(`Welcome to ${tier.toUpperCase()}! Your plan is now active.`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        toast.error('Simulation failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to process upgrade');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-red-500 mb-4">
            Simple, Transparent Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-5">
            Start free, scale as you grow
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Designed for Indian researchers and developers. No hidden fees, cancel anytime.
          </p>

          <div className="inline-flex items-center bg-bg-elevated rounded-full p-1.5 border border-silver-muted/20">
            {(['MONTHLY', 'YEARLY'] as BillingInterval[]).map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  interval === iv
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {iv === 'MONTHLY' ? 'Monthly' : 'Annual'}
                {iv === 'YEARLY' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold">
                    SAVE 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentTier === plan.tier;
            const price = interval === 'YEARLY' && plan.pricing.yearlyMonthlyEquivalent > 0
              ? plan.pricing.yearlyMonthlyEquivalent
              : plan.pricing.monthlyInr;
            const annualTotal = plan.pricing.yearlyInr;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-bg-secondary rounded-3xl border shadow-xl flex flex-col ${
                  plan.recommended
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-silver-muted/20'
                }`}
                style={{
                  transform: plan.recommended ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{plan.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                        {isCurrentPlan && <PlanBadge tier={plan.tier as any} />}
                      </div>
                      <p className="text-sm text-text-secondary">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    {plan.pricing.monthlyInr === 0 ? (
                      <div className="text-4xl font-bold text-text-primary">
                        ₹0<span className="text-base font-normal text-text-secondary">/month</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-text-primary">
                          {formatInr(price)}
                          <span className="text-base font-normal text-text-secondary">/month</span>
                        </div>
                        {interval === 'YEARLY' && (
                          <div className="text-sm text-green-600 font-medium mt-1">
                            Billed {formatInr(annualTotal)}/year
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    id={`btn-upgrade-${plan.tier}`}
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isCurrentPlan || loadingTier === plan.tier || plan.tier === 'FREE'}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                      isCurrentPlan
                        ? 'bg-bg-elevated text-text-muted cursor-default'
                        : plan.recommended
                        ? 'btn-primary shadow-lg shadow-red-500/20'
                        : plan.tier === 'PRO'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                        : 'bg-bg-elevated text-text-secondary hover:bg-silver-soft border border-silver-muted/20 hover:border-red-200'
                    }`}
                  >
                    {loadingTier === plan.tier
                      ? 'Processing...'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : plan.cta}
                  </button>
                </div>

                <div className="px-6 pb-6 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.unavailableFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                        <X size={16} className="shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🇮🇳</span>
              <h3 className="text-lg font-bold text-text-primary">Localized for India</h3>
            </div>
            <p className="text-text-secondary text-sm">
              Secure Simulated Checkout. Instant access granted. No real charges will be made in development.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
