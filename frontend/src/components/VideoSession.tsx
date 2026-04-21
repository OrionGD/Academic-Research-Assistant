import { motion } from 'motion/react';
import { Play, Monitor, Zap, Shield } from 'lucide-react';
import './VideoSession.css';

const VIDEO_ID = '1X_dii7xIoHoU8KONFGrmpKPKAnS30bSL';

export default function VideoSession() {
  return (
    <section className="vs-container">
      <div className="vs-max-width">
        <div className="vs-header">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="vs-badge"
          >
            <Zap size={14} className="vs-badge-icon" />
            Watch in Action
          </motion.div>
          <h2 className="vs-title">Master the Platform in 2 Minutes</h2>
          <p className="vs-subtitle">
            See how our advanced RAG pipeline handles complex research queries with surgical precision.
          </p>
        </div>

        <motion.div
          className="vs-video-frame"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="vs-video-chrome">
            <div className="vs-dots">
              <span className="vs-dot vs-red" />
              <span className="vs-dot vs-yellow" />
              <span className="vs-dot vs-green" />
            </div>
            <div className="vs-url">
              <Shield size={12} />
              demo.scholarai.app
            </div>
          </div>
          
          <div className="vs-video-aspect">
            <iframe
              src={`https://drive.google.com/file/d/${VIDEO_ID}/preview`}
              className="vs-iframe"
              allow="autoplay; fullscreen"
              title="ScholarAI Walkthrough"
            />
          </div>

          <div className="vs-video-glow" />
        </motion.div>

        <div className="vs-footer-stats">
          {[
            { label: 'Real-time Processing', icon: Zap },
            { label: 'Multi-Paper Search', icon: Monitor },
            { label: 'Verified Citations', icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="vs-stat-item">
              <stat.icon size={18} className="vs-stat-icon" />
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
