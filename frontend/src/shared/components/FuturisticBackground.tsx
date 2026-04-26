import React from 'react';
import { motion } from 'motion/react';
import { MouseTrail } from './MouseTrail';

export const FuturisticBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Grid */}
      <div className="absolute inset-0 grid-bg-overlay opacity-30 animate-grid-drift" />
      
      {/* Radial Depth Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_80%)]" />

      {/* Animated Neon Trails */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`trail-v-${i}`}
          className="neon-trail"
          style={{
            left: `${15 + i * 15}%`,
            top: '-10%',
            height: '20vh',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, var(--accent), transparent)',
          }}
          animate={{
            top: ['-20%', '120%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        />
      ))}

      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`trail-h-${i}`}
          className="neon-trail"
          style={{
            top: `${20 + i * 20}%`,
            left: '-10%',
            width: '20vw',
            height: '1px',
            background: 'linear-gradient(to right, transparent, var(--accent), transparent)',
          }}
          animate={{
            left: ['-20%', '120%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        />
      ))}

      {/* Light Sweeps */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="light-sweep h-full w-1/3"
          animate={{
            left: ['-100%', '200%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/5 blur-[120px] rounded-full animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 blur-[150px] rounded-full animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      {/* ── MOUSE TRAIL ────────────────────────────────────────── */}
      <MouseTrail />
    </div>
  );
};
