import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/helpers';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  trend?: 'up' | 'down';
}

export function MetricCard({ label, value, subtext, icon: Icon, color, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ translateY: -5, borderColor: 'var(--accent)' }}
      className="bb-premium-card p-8 relative overflow-hidden group border-accent/10 bg-accent/[0.02]"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-6">
          <div className={cn("p-4 w-fit rounded-2xl bg-accent/5 border border-accent/10 transition-all group-hover:shadow-[0_0_20px_var(--color-accent-glow)] group-hover:border-accent/30", color)}>
            <Icon size={28} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-text-primary tracking-tighter leading-none">{value}</h3>
            </div>
            <p className="text-[10px] font-bold text-text-muted mt-3 uppercase tracking-[0.3em] font-mono">{label}</p>
            {subtext && <p className="text-[10px] text-text-dim mt-1 font-medium">{subtext}</p>}
          </div>
        </div>
        
        {/* Sparkline Mockup */}
        <div className="w-24 h-16 self-center opacity-30 group-hover:opacity-60 transition-opacity">
           <svg viewBox="0 0 100 40" className={cn("w-full h-full stroke-2 fill-none", color)}>
              <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,10 T100,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,10 T100,15 V40 H0 Z" fill="currentColor" fillOpacity="0.05" />
           </svg>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </motion.div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient: string;
  delay?: number;
}

export function ActionCard({ title, description, icon: Icon, onClick, gradient, delay = 0 }: ActionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,242,255,0.03)', borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bb-premium-card p-6 flex items-center gap-6 group bg-transparent border-accent/10"
    >
      <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", gradient)}>
        <Icon size={26} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors flex items-center justify-between tracking-tight">
          {title}
          <ArrowRight size={18} className="text-accent opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed mt-1 font-medium">{description}</p>
      </div>
    </motion.button>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tag: string;
  delay?: number;
  children?: React.ReactNode;
}

export function FeatureCard({ title, description, icon: Icon, tag, delay = 0, children }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ borderColor: 'var(--accent)' }}
      className="bb-premium-card p-8 border-accent/10 bg-accent/[0.01] flex gap-8 overflow-hidden relative group"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between relative z-10">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-8 group-hover:scale-110 group-hover:border-accent/30 transition-all shadow-inner">
            <Icon size={24} />
          </div>
          <h4 className="text-xl font-bold text-text-primary mb-4 tracking-tighter">{title}</h4>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 font-medium">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
            {tag}
          </span>
          <ArrowRight size={16} className="text-accent opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-2 transition-all" />
        </div>
      </div>
      
      {/* Graphic Area */}
      <div className="w-40 h-full hidden md:flex items-center justify-center opacity-20 group-hover:opacity-50 transition-opacity">
        {children || (
          <div className="w-full h-full bg-accent/5 rounded-2xl animate-pulse border border-accent/10" />
        )}
      </div>
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-accent/5 blur-[80px] pointer-events-none" />
    </motion.div>
  );
}

interface InsightItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export function InsightItem({ title, description, icon: Icon, color, delay = 0 }: InsightItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all flex items-start gap-4 group"
    >
      <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", color, "bg-white/5 border border-white/10")}>
        <Icon size={18} />
      </div>
      <div className="space-y-1">
        <h5 className="text-[13px] font-bold text-text-primary">{title}</h5>
        <p className="text-[11px] text-text-muted leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
