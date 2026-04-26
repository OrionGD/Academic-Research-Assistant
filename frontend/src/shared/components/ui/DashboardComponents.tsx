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
      whileHover={{ translateY: -5 }}
      className="bb-premium-card p-6 relative overflow-hidden group border-white/[0.03]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={cn("p-3 w-fit rounded-2xl bg-white/5 border border-white/5 text-white transition-colors group-hover:border-white/10", color)}>
            <Icon size={24} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-text-primary tracking-tight">{value}</h3>
            </div>
            <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">{label}</p>
            {subtext && <p className="text-[10px] text-text-dim mt-0.5">{subtext}</p>}
          </div>
        </div>
        
        {/* Sparkline Mockup */}
        <div className="w-24 h-12 self-center">
           <svg viewBox="0 0 100 40" className={cn("w-full h-full stroke-2 fill-none", color)}>
              <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,10 T100,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,10 T100,15 V40 H0 Z" fill="currentColor" fillOpacity="0.05" />
           </svg>
        </div>
      </div>
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
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bb-premium-card p-4 flex items-center gap-4 group bg-transparent border-white/[0.05]"
    >
      <div className={cn("shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", gradient)}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-bold text-text-primary group-hover:text-white transition-colors flex items-center justify-between")}>
          {title}
          <ArrowRight size={16} className="text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </h4>
        <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{description}</p>
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
      className="bb-premium-card p-6 border-white/5 flex gap-6 overflow-hidden relative group"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-primary mb-6 group-hover:scale-110 transition-transform">
            <Icon size={20} />
          </div>
          <h4 className="text-base font-bold text-text-primary mb-3 tracking-tight">{title}</h4>
          <p className="text-xs text-text-muted leading-relaxed mb-6">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {tag}
          </span>
          <ArrowRight size={14} className="text-accent opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
      
      {/* Graphic Area */}
      <div className="w-32 h-full hidden sm:flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity">
        {children || (
          <div className="w-full h-full bg-white/5 rounded-xl animate-pulse" />
        )}
      </div>
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
