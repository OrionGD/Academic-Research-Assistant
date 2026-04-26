import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/helpers';

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export const FuturisticCard: React.FC<FuturisticCardProps> = ({ 
  children, 
  className, 
  glowColor = "var(--color-accent-glow)",
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("hud-card group", className)}
    >
      {/* Light Sweep Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent -skew-x-12 translate-x-[-100%]"
          whileHover={{ translateX: '200%' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </div>

      {/* Animated Border Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${glowColor}`,
        }}
      />
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent/20 group-hover:border-accent/60 transition-all duration-500" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent/20 group-hover:border-accent/60 transition-all duration-500" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export const NeonBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn(
    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-accent/30 text-accent bg-accent/5 shadow-[0_0_15px_var(--color-accent-glow)] backdrop-blur-md",
    className
  )}>
    {children}
  </span>
);

export const SectionDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("relative w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent my-24", className)}>
    <motion.div 
      animate={{ 
        left: ['0%', '100%'],
        opacity: [0, 1, 0]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 -translate-y-1/2 w-20 h-[2px] bg-accent blur-[2px]" 
    />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_15px_var(--accent)]" />
  </div>
);

export const HolographicPanel: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className }) => (
  <div className={cn("hud-glass rounded-3xl p-8 relative overflow-hidden border border-accent/10 shadow-2xl", className)}>
    {/* Background Pattern */}
    <div className="absolute inset-0 grid-bg-overlay opacity-5 pointer-events-none" />
    
    {/* Scanning Line Animation */}
    <motion.div 
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent z-0 blur-[1px]"
    />
    
    {title && (
      <div className="mb-8 flex items-center justify-between relative z-10 border-b border-accent/10 pb-4">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.3em]">{title}</h3>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-accent/20" />
        </div>
      </div>
    )}
    
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export const FuturisticHeading: React.FC<{ children: React.ReactNode; subtitle?: string; align?: 'left' | 'center' }> = ({ children, subtitle, align = 'center' }) => (
  <div className={cn("mb-20", align === 'center' ? 'text-center' : 'text-left')}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {subtitle && <NeonBadge className="mb-6">{subtitle}</NeonBadge>}
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-text-primary mb-8 leading-tight">
        {children}
      </h2>
      <div className={cn("h-1 bg-gradient-to-r from-accent to-transparent rounded-full", align === 'center' ? 'w-24 mx-auto' : 'w-32')} />
    </motion.div>
  </div>
);
