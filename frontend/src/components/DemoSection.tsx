import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, CheckCircle2, ArrowRight } from 'lucide-react';
import './DemoSection.css';

const GOOGLE_DRIVE_VIDEO_ID = '1X_dii7xIoHoU8KONFGrmpKPKAnS30bSL';

const FEATURES = [
  'PDF Upload & Processing',
  'Semantic Search',
  'AI Chat with Citations',
  'Paper Comparison',
] as const;

export default function DemoSection() {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
  };

  return (
    <section id="demo" className="ds-section">
      {/* ── Atmospheric background orbs ── */}
      <div className="ds-orb ds-orb-1" aria-hidden="true" />
      <div className="ds-orb ds-orb-2" aria-hidden="true" />
      <div className="ds-orb ds-orb-3" aria-hidden="true" />

      <div className="ds-grid">
        {/* ════════════════════════════
            LEFT COLUMN – Content
            ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          {/* Live badge */}
          <div className="ds-badge" aria-label="Live Product Demo">
            <span className="ds-badge-ring" aria-hidden="true" />
            <span className="ds-badge-dot" aria-hidden="true" />
            Live Product Demo
          </div>

          {/* Heading */}
          <h2 className="ds-heading">
            Experience ScholarAI
            <br />
            in{' '}
            <span className="ds-heading-accent">Real Time</span>
          </h2>

          {/* Description */}
          <p className="ds-desc">
            Watch how ScholarAI transforms your research workflow — from PDF upload to AI-generated
            insights in seconds. See semantic search, AI chat, and paper comparison live.
          </p>

          {/* Feature checklist */}
          <ul className="ds-features" aria-label="Demo highlights">
            {FEATURES.map((f) => (
              <li key={f} className="ds-feature">
                <CheckCircle2 size={15} className="ds-feature-check" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          {/* Premium glassmorphism CTA */}
          <motion.button
            className="ds-cta"
            onClick={handlePlay}
            whileHover={{ y: -3, scale: 1.025 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            aria-label="Play the live product demo"
          >
            <Play size={17} className="ds-cta-play" aria-hidden="true" fill="rgba(220,38,38,0.28)" />
            View Live Demo
            <ArrowRight size={15} className="ds-cta-arrow" aria-hidden="true" />
          </motion.button>
        </motion.div>

        {/* ════════════════════════════
            RIGHT COLUMN – Video Card
            ════════════════════════════ */}
        <motion.div
          className="ds-right"
          initial={{ opacity: 0, y: 44 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.13, ease: 'easeOut' }}
        >
          {/* Atmospheric glow behind card */}
          <div className="ds-card-glow" aria-hidden="true" />

          {/* Card */}
          <motion.div
            className="ds-card"
            whileHover={{ scale: 1.013 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            {/* Browser chrome top bar */}
            <div className="ds-chrome" aria-hidden="true">
              <div className="ds-dots">
                <span className="ds-dot ds-dot-r" />
                <span className="ds-dot ds-dot-y" />
                <span className="ds-dot ds-dot-g" />
              </div>
              <div className="ds-url-bar">
                <Play size={9} style={{ color: '#DC2626' }} />
                scholai.app — Live Walkthrough
              </div>
            </div>

            {/* 16:9 video area */}
            <div className="ds-video-wrap">
              {playing ? (
                <iframe
                  src={`https://drive.google.com/file/d/${GOOGLE_DRIVE_VIDEO_ID}/preview`}
                  className="ds-iframe"
                  allow="autoplay"
                  title="ScholarAI Product Demo"
                  style={{ border: 'none' }}
                />
              ) : (
                /* Premium placeholder with play overlay */
                <div className="ds-placeholder" onClick={handlePlay} role="button" aria-label="Play demo video" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handlePlay()}>
                  <div className="ds-placeholder-bg" aria-hidden="true" />

                  {/* Floating play button with pulsing rings */}
                  <motion.button
                    className="ds-play-btn"
                    onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                    aria-label="Play demo"
                    tabIndex={-1}
                  >
                    <span className="ds-pulse" aria-hidden="true" />
                    <span className="ds-pulse ds-pulse-2" aria-hidden="true" />
                    <span className="ds-pulse ds-pulse-3" aria-hidden="true" />
                    <Play size={28} className="ds-play-icon" aria-hidden="true" fill="white" />
                  </motion.button>

                  <p className="ds-placeholder-caption">Click to watch the full walkthrough</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
