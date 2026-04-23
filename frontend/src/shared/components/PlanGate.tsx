import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';
import { Lock, Crown } from 'lucide-react';

type PlanTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
const RANK: Record<PlanTier, number> = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PRO: 'Pro',
};

const PLAN_PRICES: Record<PlanTier, string> = {
  FREE: '₹0',
  BASIC: '₹499/mo',
  STANDARD: '₹1,499/mo',
  PRO: '₹2,999/mo',
};

interface PlanGateProps {
  requiredPlan: PlanTier;
  children: ReactNode;
  mode?: 'overlay' | 'replace';
  className?: string;
}

export function PlanGate({ requiredPlan, children, mode = 'overlay', className }: PlanGateProps) {
  const { user } = useAuth();
  const userTier = (user?.planTier || 'FREE') as PlanTier;
  const hasAccess = (RANK[userTier] ?? 0) >= (RANK[requiredPlan] ?? 0) || user?.role === 'admin';

  if (hasAccess) return <>{children}</>;

  const lockUI = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6 p-10 rounded-3xl text-center",
      "bg-white border border-red-100 shadow-xl shadow-red-900/5",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-2">
        <Lock size={32} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {PLAN_LABELS[requiredPlan]} Plan Required
        </h3>
        <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
          Upgrade to the {PLAN_LABELS[requiredPlan]} plan ({PLAN_PRICES[requiredPlan]}) to unlock this feature.
        </p>
      </div>
      <Link
        to="/pricing"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
      >
        <Crown size={16} />
        Upgrade to {PLAN_LABELS[requiredPlan]}
      </Link>
    </div>
  );

  if (mode === 'replace') return lockUI;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      <div className="blur-md pointer-events-none select-none opacity-40 transition-all duration-500 group-hover:blur-lg">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-[2px] p-6">
        {lockUI}
      </div>
    </div>
  );
}
