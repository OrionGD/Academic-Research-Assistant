import React from 'react';
import { Link } from 'react-router-dom';
import HeroMockup from './HeroMockup';
import { ArrowRight, FileText, Search, MessageSquare, CheckCircle2, Users, Play } from 'lucide-react';
import { motion } from 'motion/react';
import BackgroundParticles from './BackgroundParticles';

const HeroSection: React.FC = () => {
  return (
<section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center py-20 px-6 bg-bg-dark overflow-hidden">
      <BackgroundParticles />
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 relative z-10"> 
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 lg:w-1/2 text-left space-y-8 order-1"
        >
          <div className="inline-block bg-accent-primary/10 px-4 py-2 rounded-full border border-accent-primary/20 text-accent-primary text-sm font-bold uppercase tracking-wider">
            AI Research Assistant
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-tight">
            Transform <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-accent-primary bg-clip-text text-transparent">
              Research Papers
            </span> <br />
            Into Insights
          </h1>
          <p className="text-xl text-text-secondary leading-relaxed font-medium max-w-lg">
            Upload PDFs, get AI analysis, semantic search, and chat with your research library. Accelerate literature reviews by 80%.
          </p>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            {[
              { num: '100s', label: 'PDFs Processed', icon: FileText },
              { num: '95%', label: 'Search Accuracy', icon: Search },
              { num: '24/7', label: 'AI Available', icon: MessageSquare },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-12 h-12 text-accent-primary mx-auto mb-3 opacity-70" />
                <div className="text-2xl lg:text-3xl font-bold text-text-primary">{stat.num}</div>
                <div className="text-sm text-text-secondary font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/guest-upload" 
              className="w-full sm:w-auto bg-accent-primary text-[#0E0E10] px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-accent-primary/30 transition-all group"
            >
              Upload Paper
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <motion.a
              href="#demo"
              className="hero-demo-btn w-full sm:w-auto"
              whileHover={{ y: -3, scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              aria-label="View live demo"
            >
              <Play size={16} style={{ color: '#DC2626', fill: 'rgba(220,38,38,0.22)' }} aria-hidden="true" />
              View Live Demo
              <ArrowRight size={15} className="hero-demo-btn__arrow" aria-hidden="true" />
            </motion.a>
          </div>
        </motion.div>

        {/* Right Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 lg:w-1/2 order-2"
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

