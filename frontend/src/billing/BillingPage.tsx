import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getSubscription,
  getUsage,
  getApiKeys,
  createApiKey,
  revokeApiKey,
} from '../shared/services/api/billingService';
import { UsageSummary, SubscriptionInfo, ApiKeyInfo } from '../types/api';
import { UsageBar } from '../shared/components/UsageBar';
import { PlanBadge } from '../shared/components/PlanBadge';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CreditCard, Key, TrendingUp, Loader2, Copy, CheckCircle2, X } from 'lucide-react';

type Tab = 'overview' | 'api-keys';

const TIER_COLORS: Record<string, string> = {
  FREE: '#94a3b8',
  BASIC: '#38bdf8',
  STANDARD: '#818cf8',
  PRO: '#DC2626',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active: ['bg-green-50', '#10b981'],
    past_due: ['bg-amber-50', '#f97316'],
    canceled: ['bg-red-50', '#ef4444'],
    inactive: ['bg-slate-100', '#94a3b8'],
    trialing: ['bg-violet-50', '#818cf8'],
  };
  const [bgClass, color] = colors[status] || colors.inactive;
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${bgClass}`} style={{ color }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Welcome to your new plan.');
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [subData, usageData] = await Promise.all([getSubscription(), getUsage()]);
        setSub(subData);
        setUsage(usageData);

        const tier = subData.planTier;
        if (tier === 'BASIC' || tier === 'STANDARD' || tier === 'PRO') {
          const keys = await getApiKeys();
          setApiKeys(keys);
        }
      } catch {
        toast.error('Failed to load billing info');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleManageSubscription = () => {
    navigate('/pricing');
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return toast.error('Enter a key name');
    try {
      setCreatingKey(true);
      const result = await createApiKey(newKeyName.trim());
      setNewKeyValue(result.key);
      setApiKeys(prev => [...prev, { name: result.name, prefix: result.prefix, lastUsedAt: null, createdAt: new Date().toISOString() }]);
      setNewKeyName('');
      toast.success('API key created! Copy it now.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (prefix: string, name: string) => {
    if (!confirm(`Revoke key "${name}"? This cannot be undone.`)) return;
    try {
      await revokeApiKey(prefix);
      setApiKeys(prev => prev.filter((k: any) => k.prefix !== prefix));
      toast.success('API key revoked');
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  const planTier = sub?.planTier || user?.planTier || 'FREE';
  const tierColor = TIER_COLORS[planTier] || '#94a3b8';
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const isPro = planTier === 'STANDARD' || planTier === 'PRO';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Billing & Plan</h1>
        <p className="text-text-secondary mt-1">Manage your subscription, usage, and API access</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">Current Plan</h2>
                  <PlanBadge tier={planTier as any} size="md" />
                  {sub && <StatusBadge status={sub.subscriptionStatus} />}
                </div>
                {sub && sub.planTier !== 'FREE' && (
                  <div className="space-y-1 text-sm text-text-secondary">
                    {sub.amountInr > 0 && (
                      <span>₹{sub.amountInr.toLocaleString('en-IN')} / {sub.billingInterval}</span>
                    )}
                    {periodEnd && (
                      <span>
                        {sub.cancelAtPeriodEnd ? `Cancels on ${periodEnd}` : `Renews on ${periodEnd}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {isPro && (
                  <button
                    onClick={handleManageSubscription}
                    className="px-5 py-2.5 rounded-xl border border-silver-muted/30 bg-bg-elevated text-text-secondary hover:bg-bg-secondary hover:border-red-200 hover:text-red-500 transition-all text-sm font-semibold"
                  >
                    Change / Upgrade Plan
                  </button>
                )}
                {planTier === 'FREE' && (
                  <Link to="/pricing" className="btn-primary flex items-center gap-2">
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          <div className="flex gap-2 p-1.5 bg-bg-elevated rounded-2xl">
            {(['overview', 'api-keys'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  tab === t
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-text-secondary hover:bg-bg-secondary'
                }`}
              >
                {t === 'overview' ? (
                  <>
                    <TrendingUp size={16} />
                    Usage Overview
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    API Keys
                  </>
                )}
              </button>
            ))}
          </div>

          {tab === 'overview' && usage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <CreditCard size={20} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">This Month's Usage</h3>
                </div>
                <div className="space-y-6">
                  <UsageBar label="Document Uploads" used={usage.uploads.used} limit={usage.uploads.limit} />
                  <UsageBar label="AI Queries" used={usage.queries.used} limit={usage.queries.limit} />
                  <UsageBar label="Storage" used={Math.round(usage.storage.usedMb)} limit={usage.storage.limitMb} unit=" MB" />
                </div>

                {planTier === 'FREE' && (
                  (usage.uploads.percentage >= 60 || usage.queries.percentage >= 60) && (
                    <div className="mt-6 p-5 bg-red-50 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-red-500 mb-1">
                          You've used {Math.max(usage.uploads.percentage, usage.queries.percentage)}% of your free quota
                        </p>
                        <p className="text-sm text-text-secondary">Upgrade to Standard for ₹1,499/month and get 20× more capacity</p>
                      </div>
                      <Link to="/pricing" className="btn-primary whitespace-nowrap text-sm">
                        Upgrade →
                      </Link>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}

          {tab === 'api-keys' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {!isPro ? (
                <div className="bg-bg-secondary p-12 rounded-3xl border border-silver-muted/20 shadow-xl text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Key size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">API Access requires Standard plan</h3>
                  <p className="text-text-secondary text-sm mb-6">Get up to 3 API keys on Standard, 5 on Pro.</p>
                  <Link to="/pricing" className="btn-primary inline-flex items-center gap-2">
                    Upgrade to Standard →
                  </Link>
                </div>
              ) : (
                <>
                  {newKeyValue && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-green-50 rounded-2xl border border-green-200"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <p className="font-bold text-green-600 text-sm flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          Copy your key now — it won't be shown again!
                        </p>
                        <button onClick={() => setNewKeyValue(null)} className="p-1 hover:bg-green-100 rounded-lg transition-colors">
                          <X size={16} className="text-green-600" />
                        </button>
                      </div>
                      <code className="block bg-slate-900 text-purple-400 p-4 rounded-xl font-mono text-xs break-all border border-slate-700">
                        {newKeyValue}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(newKeyValue); toast.success('Copied!'); }}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                      >
                        <Copy size={14} />
                        Copy to Clipboard
                      </button>
                    </motion.div>
                  )}

                  <div className="bg-bg-secondary p-6 rounded-3xl border border-silver-muted/20 shadow-xl">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Create New API Key</h3>
                    <div className="flex gap-3">
                      <input
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="Key name (e.g. My Notebook)"
                        className="input-field flex-1"
                        onKeyDown={e => e.key === 'Enter' && handleCreateKey()}
                      />
                      <button
                        onClick={handleCreateKey}
                        disabled={creatingKey}
                        className="btn-primary flex items-center gap-2 px-6"
                      >
                        {creatingKey ? <Loader2 size={16} className="animate-spin" /> : '+ Create'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-bg-secondary p-6 rounded-3xl border border-silver-muted/20 shadow-xl">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Active Keys</h3>
                    {apiKeys.length === 0 ? (
                      <p className="text-text-secondary text-sm text-center py-8">No API keys yet. Create one above.</p>
                    ) : (
                      <div className="space-y-3">
                        {apiKeys.map((key) => (
                          <div key={key.prefix} className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10 flex-wrap gap-3">
                            <div>
                              <p className="font-semibold text-text-primary mb-1">{key.name}</p>
                              <code className="text-xs text-text-muted">{key.prefix}••••••••••••••••</code>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-text-muted">
                                {key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString('en-IN')}` : 'Never used'}
                              </span>
                              <button
                                onClick={() => handleRevokeKey(key.prefix, key.name)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-text-muted">
                    Use <code className="bg-bg-elevated px-2 py-0.5 rounded text-text-secondary">X-API-Key: your_key</code> header in your requests
                  </p>
                </>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
