import React from 'react';
import { Link } from 'react-router-dom';
import HeroMockup from './HeroMockup';
import { ArrowRight, FileText, Search, MessageSquare, CheckCircle2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import BackgroundParticles from './BackgroundParticles';

const HeroSection: React.FC = () => {
  return (
<section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center py-20 px-6 bg-bg-primary overflow-hidden">
      <BackgroundParticles />
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 relative z-10"> 
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 lg:w-1/2 text-left space-y-8 order-1"
        >
          <div className="inline-block bg-accent-soft px-4 py-2 rounded-full border border-accent-primary/20 text-accent-primary text-sm font-bold uppercase tracking-wider">
            Now Fully Open Access
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-text-primary leading-tight">
            Research at the <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-accent-primary via-accent-hover to-accent-primary bg-clip-text text-transparent">
              Speed of Thought
            </span>
          </h1>
          <p className="text-xl text-text-secondary leading-relaxed font-medium max-w-lg">
            ScholarAI is an open-access research platform. Upload PDFs, get AI-powered analysis, search semantically across your library, and chat with your papers through RAG.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto bg-accent-primary text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-accent-primary/30 transition-all group btn-glow-glitter"
            >
              Explore Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
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

