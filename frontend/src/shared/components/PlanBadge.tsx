import React from 'react';

type PlanTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO' | 'free' | 'pro' | 'enterprise';

interface PlanBadgeProps {
  tier?: PlanTier;
  size?: 'sm' | 'md';
  className?: string;
}

const PLAN_STYLES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  FREE: {
    label: 'Free',
    bg: 'bg-slate-100',
    text: '#94a3b8',
    border: 'border-slate-200',
    dot: '#94a3b8',
  },
  BASIC: {
    label: 'Basic',
    bg: 'bg-blue-50',
    text: '#38bdf8',
    border: 'border-blue-200',
    dot: '#38bdf8',
  },
  STANDARD: {
    label: 'Standard',
    bg: 'bg-violet-50',
    text: '#818cf8',
    border: 'border-violet-200',
    dot: '#818cf8',
  },
  PRO: {
    label: 'Pro',
    bg: 'bg-red-50',
    text: '#DC2626',
    border: 'border-red-200',
    dot: '#DC2626',
  },
  free: {
    label: 'Free',
    bg: 'bg-slate-100',
    text: '#94a3b8',
    border: 'border-slate-200',
    dot: '#94a3b8',
  },
  pro: {
    label: 'Pro',
    bg: 'bg-red-50',
    text: '#DC2626',
    border: 'border-red-200',
    dot: '#DC2626',
  },
  enterprise: {
    label: 'Enterprise',
    bg: 'bg-amber-50',
    text: '#fbbf24',
    border: 'border-amber-200',
    dot: '#fbbf24',
  },
};

export function PlanBadge({ tier = 'FREE', size = 'sm', className = '' }: PlanBadgeProps) {
  const s = PLAN_STYLES[tier] || PLAN_STYLES.FREE;
  const padding = size === 'md' ? 'px-3 py-1.5' : 'px-2 py-0.5';
  const fontSize = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide uppercase whitespace-nowrap ${s.bg} ${padding} ${fontSize} ${className}`}
      style={{ color: s.text, borderColor: s.border === 'border-slate-200' ? undefined : s.dot + '30' }}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: 6,
          height: 6,
          background: s.dot,
          boxShadow: `0 0 4px ${s.dot}`,
        }}
      />
      {s.label}
    </span>
  );
}
