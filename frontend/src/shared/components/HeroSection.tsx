import React from 'react';
import { Link } from 'react-router-dom';
import HolographicInterface from './HolographicInterface';
import { ArrowRight, FileText, Search, MessageSquare, CheckCircle2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import CyberGridBackground from './CyberGridBackground';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center py-20 px-6 gap-8 lg:gap-24 bg-background overflow-hidden">
      <CyberGridBackground />

      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 relative z-10">
        {/* Left Content */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="flex-1 lg:w-1/2 text-center lg:text-left space-y-6 lg:space-y-8 order-1"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="inline-block bg-accent/10 px-4 py-2 rounded-full border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_var(--color-accent-glow)]"
          >
            Now Fully Open Access
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-text-secondary leading-[1.1] drop-shadow-[0_0_15px_var(--color-accent-glow)]"
          >
            Research at the <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-accent via-blue-400 to-accent bg-clip-text text-transparent">
              Speed of Thought
            </span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-lg mx-auto lg:mx-0"
          >
            ScholarAI is an open-access research platform. Upload PDFs, get AI-powered analysis, search semantically across your library, and chat with your papers through RAG.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="flex flex-col sm:flex-row gap-4 pt-4 items-center justify-center lg:justify-start"
          >
            <Link
              to="/dashboard"
              className="w-full sm:w-auto bg-accent text-primary-foreground px-10 py-5 rounded-2xl font-bold text-base lg:text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_var(--color-accent-glow)] hover:shadow-[0_0_50px_var(--color-accent-glow)] transition-all group active:scale-95 border border-accent/30"
            >
              Explore Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="flex-1 lg:w-1/2 order-2 flex items-center justify-center lg:justify-end scale-75 sm:scale-100"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="w-full"
          >
            <HolographicInterface />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

