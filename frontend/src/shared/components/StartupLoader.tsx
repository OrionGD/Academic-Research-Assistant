import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './StartupLoader.css';

const STATUS_MESSAGES = [
  'Initializing workspace...',
  'Loading intelligent modules...',
  'Preparing your experience...',
  'Almost ready...',
] as const;

/** Total minimum display time in milliseconds */
const MIN_DISPLAY_MS = 2800;

interface StartupLoaderProps {
  /** Called after the exit animation fully completes */
  onComplete: () => void;
}

export default function StartupLoader({ onComplete }: StartupLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Keep a stable ref so the RAF callback always calls the latest onComplete
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Progress via rAF ──────────────────────────────────────────────
  useEffect(() => {
    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min((elapsed / MIN_DISPLAY_MS) * 100, 100);
      setProgress(p);

      if (p < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Brief pause at 100% before exit
        setTimeout(() => setVisible(false), 350);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Status text cycling ───────────────────────────────────────────
  useEffect(() => {
    const interval = MIN_DISPLAY_MS / STATUS_MESSAGES.length;
    const id = setInterval(() => {
      setStatusIdx((i: any) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, interval);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
      {visible && (
        <motion.div
          className="sl-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Subtle grid pattern */}
          <div className="sl-grid-overlay" />

          {/* Ambient floating orbs */}
          <div className="sl-orb sl-orb-1" />
          <div className="sl-orb sl-orb-2" />
          <div className="sl-orb sl-orb-3" />
          <div className="sl-orb sl-orb-4" />

          {/* ── Central glassmorphism card ── */}
          <div className="sl-panel">

            {/* Logo with glow pulse */}
            <motion.div
              className="sl-logo-wrap"
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src="/logo.png" alt="ARAS logo" className="sl-logo" />
              <div className="sl-logo-glow" aria-hidden="true" />
            </motion.div>

            {/* Product name */}
            <motion.h1
              className="sl-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              ARAS
            </motion.h1>

            {/* Product descriptor */}
            <motion.p
              className="sl-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              Academic Research Analysis System
            </motion.p>

            {/* Gradient progress bar */}
            <motion.div
              className="sl-progress-track"
              initial={{ opacity: 0, scaleX: 0.85 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Loading progress"
            >
              <div
                className={`sl-progress-fill${progress > 2 ? ' sl-progress-fill--active' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </motion.div>

            {/* Cycling status message */}
            <div className="sl-status-wrap" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIdx}
                  className="sl-status"
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -7 }}
                  transition={{ duration: 0.28 }}
                >
                  {STATUS_MESSAGES[statusIdx]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Percentage counter */}
            <motion.span
              className="sl-percent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              aria-hidden="true"
            >
              {Math.round(progress)}%
            </motion.span>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
