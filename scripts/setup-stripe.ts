import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend dir
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'sk_test_REPLACE_ME') {
  console.error('❌ Error: STRIPE_SECRET_KEY is not set in backend/.env');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as any,
});

async function setup() {
  console.log('🚀 Starting ARAS Stripe Setup (INR Optimized)...');

  try {
    // 1. Pro Plan
    console.log('📦 Creating Pro Plan...');
    const proProduct = await stripe.products.create({
      name: 'ARAS Pro',
      description: 'Advanced features for individual researchers',
      metadata: { tier: 'pro' },
    });

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 149900, // ₹1,499.00
      currency: 'inr',
      recurring: { interval: 'month' },
    });

    const proAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1499900, // ₹14,999.00
      currency: 'inr',
      recurring: { interval: 'year' },
    });

    // 2. Enterprise Plan
    console.log('🏢 Creating Enterprise Plan...');
    const entProduct = await stripe.products.create({
      name: 'ARAS Enterprise',
      description: 'Unlimited access and priority support for teams',
      metadata: { tier: 'enterprise' },
    });

    const entMonthly = await stripe.prices.create({
      product: entProduct.id,
      unit_amount: 799900, // ₹7,999.00
      currency: 'inr',
      recurring: { interval: 'month' },
    });

    const entAnnual = await stripe.prices.create({
      product: entProduct.id,
      unit_amount: 7999900, // ₹79,999.00
      currency: 'inr',
      recurring: { interval: 'year' },
    });

    console.log('\n✅ Stripe Setup Complete!');
    console.log('--------------------------------------------------');
    console.log('Copy these Price IDs to your backend/.env file:');
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnual.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${entMonthly.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_ANNUAL=${entAnnual.id}`);
    console.log('--------------------------------------------------');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
  }
}

setup();
