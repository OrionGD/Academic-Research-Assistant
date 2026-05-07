/**
 * ARAS Razorpay Setup Script
 *
 * Creates Razorpay Plans for each subscription tier.
 * These Plan IDs must be added to your .env file.
 *
 * Usage:
 *   cd scripts
 *   npx ts-node setup-razorpay.ts
 *
 * Required env vars (set in root .env):
 *   RAZORPAY_KEY_ID=rzp_test_...
 *   RAZORPAY_KEY_SECRET=...
 */

import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || KEY_ID === 'rzp_test_REPLACE_ME' || !KEY_SECRET) {
  console.error('❌ Error: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

const PLANS = [
  { name: 'ARAS Pro Monthly',    amount: 149900, period: 'monthly',  intervalCount: 1, tier: 'pro',        envKey: 'RAZORPAY_PLAN_PRO_MONTHLY' },
  { name: 'ARAS Pro Annual',     amount: 1499900, period: 'yearly',  intervalCount: 1, tier: 'pro',        envKey: 'RAZORPAY_PLAN_PRO_ANNUAL' },
  { name: 'ARAS Enterprise Monthly', amount: 799900, period: 'monthly', intervalCount: 1, tier: 'enterprise', envKey: 'RAZORPAY_PLAN_ENTERPRISE_MONTHLY' },
  { name: 'ARAS Enterprise Annual',  amount: 7999900, period: 'yearly', intervalCount: 1, tier: 'enterprise', envKey: 'RAZORPAY_PLAN_ENTERPRISE_ANNUAL' },
];

async function main() {
  console.log('🚀 Starting ARAS Razorpay Plan Setup...\n');

  const results: Record<string, string> = {};

  for (const plan of PLANS) {
    try {
      const created = await (razorpay.plans as any).create({
        period: plan.period,
        interval: plan.intervalCount,
        item: {
          name: plan.name,
          amount: plan.amount,
          currency: 'INR',
          description: `ARAS ${plan.tier} plan — ${plan.period}`,
        },
        notes: { tier: plan.tier },
      });
      console.log(`✅ Created: ${plan.name} → ${created.id}`);
      results[plan.envKey] = created.id;
    } catch (err: any) {
      console.error(`❌ Failed to create ${plan.name}:`, err.error?.description || err.message);
    }
  }

  console.log('\n📋 Add these to your .env file:\n');
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`);
  }
  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
