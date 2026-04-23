import React from 'react';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  className?: string;
}

function getColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f97316';
  if (pct >= 50) return '#eab308';
  return '#DC2626';
}

export function UsageBar({ label, used, limit, unit = '', className = '' }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = getColor(pct);
  const nearLimit = !isUnlimited && pct >= 80;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className={`text-xs font-medium ${nearLimit ? '' : 'text-text-muted'}`} style={{ color: nearLimit ? color : undefined }}>
          {isUnlimited
            ? `${used.toLocaleString()}${unit} / ∞`
            : `${used.toLocaleString()}${unit} / ${limit.toLocaleString()}${unit}`}
        </span>
      </div>

      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color})`,
              boxShadow: nearLimit ? `0 0 8px ${color}40` : 'none',
            }}
          />
        )}
        {isUnlimited && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-200 via-red-300 to-red-200 animate-pulse"
          />
        )}
      </div>

      {nearLimit && !isUnlimited && (
        <p className="text-xs font-medium" style={{ color }}>
          {100 - pct}% remaining — consider upgrading your plan
        </p>
      )}
    </div>
  );
}
