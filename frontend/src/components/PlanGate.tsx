import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type PlanTier = 'free' | 'pro' | 'enterprise';
const RANK: Record<PlanTier, number> = { free: 0, pro: 1, enterprise: 2 };

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_PRICES: Record<PlanTier, string> = {
  free: '₹0',
  pro: '₹1,499/mo',
  enterprise: '₹7,999/mo',
};

interface PlanGateProps {
  requiredPlan: PlanTier;
  children: ReactNode;
  /** Optional: render inline instead of with overlay */
  mode?: 'overlay' | 'replace';
}

export function PlanGate({ requiredPlan, children, mode = 'overlay' }: PlanGateProps) {
  const { user } = useAuth();
  const userTier = (user?.planTier || 'free') as PlanTier;
  const hasAccess = (RANK[userTier] ?? 0) >= (RANK[requiredPlan] ?? 0);

  if (hasAccess) return <>{children}</>;

  const lockUI = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '40px 24px',
        borderRadius: 16,
        border: '1px solid rgba(99,102,241,0.2)',
        background: 'rgba(99,102,241,0.05)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 36 }}>🔒</div>
      <div>
        <h3 style={{ margin: '0 0 6px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>
          {PLAN_LABELS[requiredPlan]} Plan Required
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
          This feature is available on the {PLAN_LABELS[requiredPlan]} plan ({PLAN_PRICES[requiredPlan]}).
        </p>
      </div>
      <Link
        to="/pricing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
        }}
      >
        ✦ Upgrade to {PLAN_LABELS[requiredPlan]}
      </Link>
    </div>
  );

  if (mode === 'replace') return lockUI;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10,14,28,0.7)',
          backdropFilter: 'blur(4px)',
          borderRadius: 12,
        }}
      >
        {lockUI}
      </div>
    </div>
  );
}
