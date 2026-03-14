import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles as SparklesIcon, Shield, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import BackgroundParticles from './BackgroundParticles';

const HeroSection: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Calculate offset relative to center (-0.5 to 0.5)
    const x = (clientX / innerWidth) - 0.5;
    const y = (clientY / innerHeight) - 0.5;
    
    // Use requestAnimationFrame for smoother performance
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(() => {
      setMousePos({ x, y });
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleMouseMove]);

  // Parallax depth multipliers
  const getTransform = (depth: number) => {
    const x = mousePos.x * depth * 50; // Max 25px if depth is 0.5
    const y = mousePos.y * depth * 40; // Max 20px if depth is 0.5
    return `translate3d(${x}px, ${y}px, 0)`;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-transparent py-20 px-6">
      {/* Background Floating Particles */}
      <BackgroundParticles />

      {/* Soft AI Glow Light */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-35 blur-[140px] pointer-events-none z-0 animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Tagline (Depth 1) */}
          <div 
            className="float-layer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-highlight text-sm font-bold backdrop-blur-sm animate-float-y"
            style={{ 
              transform: getTransform(0.2),
              animationDelay: '0s'
            }}
          >
            <SparklesIcon size={16} />
            <span>Next-Gen Research Intelligence</span>
          </div>

          {/* Headline (Depth 2) */}
          <div 
            className="float-layer space-y-4 animate-float-y"
            style={{ 
              transform: getTransform(0.5),
              animationDelay: '1s'
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text-primary leading-[1.1]">
              AI-Powered Research Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-highlight to-accent-primary">
                for the Modern Academic
              </span>
            </h1>
          </div>

          {/* Description (Depth 3) */}
          <div 
            className="float-layer max-w-3xl mx-auto space-y-6 animate-float-y"
            style={{ 
              transform: getTransform(0.3),
              animationDelay: '2s'
            }}
          >
            <p className="text-xl text-text-secondary leading-relaxed">
              Upload research papers, extract insights, run semantic searches, and converse with your entire research library using advanced AI.
            </p>
            <p className="text-lg text-text-secondary/70 opacity-80 leading-relaxed">
              Transform static research papers into an intelligent knowledge system. Our platform analyzes academic documents, extracts methodologies and insights, and enables deep semantic search across your research library.
            </p>
          </div>

          {/* Actions (Depth 4) */}
          <div 
            className="float-layer flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-float-y"
            style={{ 
              transform: getTransform(0.8),
              animationDelay: '0.5s'
            }}
          >
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-accent-primary text-bg-dark rounded-2xl font-bold text-lg hover:bg-accent-highlight transition-all shadow-[0_0_15px_rgba(34,197,94,0.35)] flex items-center justify-center gap-2 group"
            >
              Get Started for Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/documentation" 
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-accent-primary border border-accent-primary/50 rounded-2xl font-bold text-lg hover:bg-accent-primary/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
            >
              View Documentation
            </Link>
          </div>

          {/* Trust Indicators */}
          <div 
            className="float-layer pt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
            style={{ transform: getTransform(0.1) }}
          >
            <div className="flex items-center gap-2 text-text-primary font-bold tracking-widest text-xs uppercase">
              <Shield size={16} className="text-accent-primary" />
              <span>Enterprise Secure</span>
            </div>
            <div className="flex items-center gap-2 text-text-primary font-bold tracking-widest text-xs uppercase">
              <Globe size={16} className="text-accent-primary" />
              <span>Global Research Network</span>
            </div>
            <div className="flex items-center gap-2 text-text-primary font-bold tracking-widest text-xs uppercase">
              <SparklesIcon size={16} className="text-accent-primary" />
              <span>Gemini 1.5 Pro Powered</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
    </section>
  );
};

export default HeroSection;
