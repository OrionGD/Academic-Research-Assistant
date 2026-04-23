import api from './client';
import { UsageSummary, SubscriptionInfo, ApiKeyInfo } from '../../../types/api';

// ─── Plans (public) ──────────────────────────────────────────────────────────
export async function getPlans() {
  const res = await api.get('/billing/plans');
  return res.data;
}

// ─── Subscription ────────────────────────────────────────────────────────────
export async function getSubscription(): Promise<SubscriptionInfo> {
  const res = await api.get('/billing/subscription');
  return res.data;
}

// ─── Usage ───────────────────────────────────────────────────────────────────
export async function getUsage(): Promise<UsageSummary> {
  const res = await api.get('/billing/usage');
  return res.data;
}

// ─── API Keys ────────────────────────────────────────────────────────────────
export async function getApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await api.get('/keys');
  return res.data.keys;
}

export async function createApiKey(name: string): Promise<{ key: string; prefix: string; name: string }> {
  const res = await api.post('/keys', { name });
  return res.data;
}

export async function revokeApiKey(prefix: string): Promise<void> {
  await api.delete(`/keys/${prefix}`);
}

// ─── Verification ────────────────────────────────────────────────────────────
export async function verifyPayment(data: any): Promise<any> {
  const res = await api.post('/billing/verify', data);
  return res.data;
}
