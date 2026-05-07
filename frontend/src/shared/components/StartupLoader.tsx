import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import './StartupLoader.css';

const STATUS_MESSAGES = [
  'Synthesizing Neural Pathways...',
  'Indexing Global Research Data...',
  'Calibrating Semantic Engine...',
  'Optimizing Vector Embeddings...',
  'Finalizing Workspace Environment...',
] as const;

const MIN_DISPLAY_MS = 3000;

interface StartupLoaderProps {
  onComplete?: () => void;
}

export default function StartupLoader({ onComplete = () => {} }: StartupLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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
        setTimeout(() => setVisible(false), 500);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const interval = MIN_DISPLAY_MS / STATUS_MESSAGES.length;
    const id = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, interval);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
      {visible && (
        <motion.div
          className="scholar-loader-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          {/* Deep Ambient Background */}
          <div className="loader-bg-ambient">
            <div className="ambient-glow glow-1" />
            <div className="ambient-glow glow-2" />
          </div>

          {/* Particle Web */}
          <div className="neural-web-overlay">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`neural-node node-${i + 1}`} />
            ))}
          </div>

          <div className="loader-content-panel">
            {/* Brand Identity */}
            <motion.div
              className="loader-logo-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="logo-ring-outer" />
              <div className="logo-ring-inner" />
              <Logo size="xxl" showText={false} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="loader-text-wrap"
            >
              <h1 className="loader-brand-name">
                SCHOLAR<span className="text-accent-primary">AI</span>
              </h1>
              <div className="loader-divider" />
              <p className="loader-tagline">Advanced Research Intelligence</p>
            </motion.div>

            {/* Premium Progress Section */}
            <div className="loader-progress-section">
              <div className="progress-bar-container">
                <motion.div 
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
                <div className="progress-bar-glow" style={{ left: `${progress}%` }} />
              </div>

              <div className="loader-meta">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIdx}
                    className="loader-status-text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                  >
                    {STATUS_MESSAGES[statusIdx]}
                  </motion.p>
                </AnimatePresence>
                <span className="loader-percentage font-mono">
                  {Math.round(progress).toString().padStart(3, '0')}%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Compliance Label */}
          <motion.div 
            className="loader-footer-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1, duration: 1 }}
          >
            System Core v2.4.0 • Secure Session Indexing
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
