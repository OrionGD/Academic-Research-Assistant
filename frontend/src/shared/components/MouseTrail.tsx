import React, { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const TRAIL_SIZE = 12;

export const MouseTrail: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Track if we are on mobile to disable trail
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {[...Array(TRAIL_SIZE)].map((_, i) => (
        <CursorDot key={i} index={i} total={TRAIL_SIZE} />
      ))}
    </div>
  );
};

const CursorDot = ({ index, total }: { index: number; total: number }) => {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Damping increases as we go further back in the trail
  const springConfig = { damping: 20 + index * 5, stiffness: 200 - index * 10, mass: 0.5 + index * 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const size = 12 - (index * 0.8);
  const opacity = 1 - (index / total);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Small delay for each dot to create the "tail" effect
      setTimeout(() => {
        x.set(e.clientX - size / 2);
        y.set(e.clientY - size / 2);
      }, index * 20); 
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [index, size, x, y]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--accent)',
        opacity: opacity * 0.6,
        filter: `blur(${index * 0.5}px) drop-shadow(0 0 10px var(--accent))`,
        zIndex: 9999 - index,
      }}
    />
  );
};
