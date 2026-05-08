import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

/**
 * CyberGridBackground
 * A production-ready 3D animated cyber-grid background system.
 */
const CyberGridBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  const springConfig = { damping: 30, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [isMouseIn, setIsMouseIn] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
      if (!isMouseIn) setIsMouseIn(true);
    };

    const handleMouseLeave = () => setIsMouseIn(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, isMouseIn]);

  // Particles with depth
  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1,
      z: Math.random() * 200 - 100,
    }));
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-background overflow-hidden pointer-events-none select-none transition-colors duration-700 z-0"
    >
      {/* ── 1. AMBIENT GLOW ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--accent-soft)_0%,transparent_80%)] opacity-40" />

      {/* ── 2. 3D GRID FLOOR ── */}
      <div 
        className="absolute bottom-0 left-[-50%] w-[200%] h-[60%] overflow-hidden"
        style={{
          perspective: '1000px',
          perspectiveOrigin: '50% 0%',
        }}
      >
        {/* The Grid */}
        <motion.div
          style={{
            rotateX: '70deg',
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, var(--color-border) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 85%)',
          }}
          className="absolute inset-0 w-full h-[200%] origin-top"
          animate={{
            backgroundPosition: ['0px 0px', '0px 80px'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Mouse Interaction Glow on Grid */}
        <motion.div
          style={{
            rotateX: '70deg',
            opacity: isMouseIn ? 0.8 : 0,
            background: useTransform(
              [smoothX, smoothY],
              ([x, y]) => {
                // Adjust for the 200% width and perspective
                const normalizedX = (Number(x) - 0.5) * 100 + 50; 
                return `radial-gradient(circle at ${normalizedX}% ${Number(y) * 150}%, var(--accent-primary) 0%, transparent 20%)`;
              }
            ),
          }}
          className="absolute inset-0 w-full h-[200%] origin-top mix-blend-overlay transition-opacity duration-700"
        />

        {/* Pulse Lines */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              translateY: ['100%', '-100%'],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 8,
              delay: i * 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-t from-accent/20 via-transparent to-transparent h-32 blur-2xl"
            style={{ transform: 'rotateX(70deg) translateZ(0)' }}
          />
        ))}
      </div>

      {/* ── 3. MOUSE TRAIL GLOW ── */}
      <motion.div
        style={{
          left: useTransform(smoothX, (x) => `${x * 100}%`),
          top: useTransform(smoothY, (y) => `${y * 100}%`),
          opacity: isMouseIn ? 0.4 : 0,
        }}
        className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,var(--accent-soft)_0%,transparent_70%)] blur-3xl pointer-events-none transition-opacity duration-500 z-10 mix-blend-screen"
      />

      {/* ── 4. HORIZON CORE ── */}
      <div className="absolute top-[40%] left-0 w-full flex flex-col items-center justify-center">
        {/* Core Flare */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[1000px] h-[400px] bg-[radial-gradient(ellipse_at_50%_50%,var(--accent-soft)_0%,transparent_75%)] blur-[120px]"
        />
        
        {/* Energy Line */}
        <motion.div 
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent blur-[1px]"
        />
        
        {/* Core Node */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px var(--accent-primary)',
              '0 0 40px var(--accent-primary)',
              '0 0 20px var(--accent-primary)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute w-1.5 h-1.5 bg-white rounded-full z-20"
        />
      </div>

      {/* ── 5. FLOATING PARTICLES ── */}
      <div className="absolute inset-0" style={{ perspective: '1000px' }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, z: p.z, opacity: 0 }}
            animate={{
              y: [`${p.y}%`, `${p.y - 15}%`],
              opacity: [0, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
            className="absolute rounded-full bg-accent/40"
            style={{
              width: p.size,
              height: p.size,
              boxShadow: '0 0 10px var(--accent-primary)',
            }}
          />
        ))}
      </div>

      {/* ── 6. HUD OVERLAYS ── */}
      <div className="absolute inset-0">
        {/* Scanning Sweep */}
        <motion.div
          animate={{ translateY: ['-100%', '200%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[30vh] bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none"
        />

        {/* UI Elements */}
        <div className="absolute inset-0 p-8 border border-accent/5 pointer-events-none opacity-40">
           <div className="absolute top-10 left-10 w-32 h-32 border-t-2 border-l-2 border-accent/20 rounded-tl-3xl" />
           <div className="absolute top-10 right-10 w-32 h-32 border-t-2 border-r-2 border-accent/20 rounded-tr-3xl" />
           <div className="absolute bottom-10 left-10 w-32 h-32 border-b-2 border-l-2 border-accent/20 rounded-bl-3xl" />
           <div className="absolute bottom-10 right-10 w-32 h-32 border-b-2 border-r-2 border-accent/20 rounded-br-3xl" />
        </div>

        {/* Faint Grid Texture */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-soft-light pointer-events-none" />
      </div>

      {/* ── 7. DEPTH & ATMOSPHERE ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,var(--background)_90%)] opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-40" />
    </div>
  );
};

export default CyberGridBackground;
