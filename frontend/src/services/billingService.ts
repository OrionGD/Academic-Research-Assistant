import axios from 'axios';
import { UsageSummary, SubscriptionInfo, ApiKeyInfo } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getHeaders() {
  const token = localStorage.getItem('aras_token');
  return { Authorization: `Bearer ${token}` };
}

// ─── Plans (public) ──────────────────────────────────────────────────────────
export async function getPlans() {
  const res = await axios.get(`${API_URL}/billing/plans`);
  return res.data;
}

// ─── Create Razorpay Order ───────────────────────────────────────────────────
// Returns orderId, amount, currency, keyId, prefill — passed to Razorpay modal
export async function createOrder(
  planTier: 'pro' | 'enterprise',
  interval: 'month' | 'year'
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planTier: string;
  interval: string;
  prefill: { name: string; email: string };
}> {
  const res = await axios.post(
    `${API_URL}/billing/order`,
    { planTier, interval },
    { headers: getHeaders() }
  );
  return res.data;
}

// ─── Verify Payment ──────────────────────────────────────────────────────────
// Called after Razorpay modal closes with a successful payment
export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planTier: string;
  interval: string;
}): Promise<{ success: boolean; planTier: string; redirectUrl: string }> {
  const res = await axios.post(`${API_URL}/billing/verify`, payload, { headers: getHeaders() });
  return res.data;
}

// ─── Subscription ────────────────────────────────────────────────────────────
export async function getSubscription(): Promise<SubscriptionInfo> {
  const res = await axios.get(`${API_URL}/billing/subscription`, { headers: getHeaders() });
  return res.data;
}

// ─── Usage ───────────────────────────────────────────────────────────────────
export async function getUsage(): Promise<UsageSummary> {
  const res = await axios.get(`${API_URL}/billing/usage`, { headers: getHeaders() });
  return res.data;
}

// ─── API Keys ────────────────────────────────────────────────────────────────
export async function getApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await axios.get(`${API_URL}/keys`, { headers: getHeaders() });
  return res.data.keys;
}

export async function createApiKey(name: string): Promise<{ key: string; prefix: string; name: string }> {
  const res = await axios.post(`${API_URL}/keys`, { name }, { headers: getHeaders() });
  return res.data;
}

export async function revokeApiKey(prefix: string): Promise<void> {
  await axios.delete(`${API_URL}/keys/${prefix}`, { headers: getHeaders() });
}
