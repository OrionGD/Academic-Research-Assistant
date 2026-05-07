import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Shield, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/helpers';
import { LOGO_URL } from './Logo';

const NAV_LINKS = [
  { label: 'Home', href: '/', type: 'route' },
  { label: 'System', href: '/system', type: 'route' },
  { label: 'Docs', href: '/documentation/api-reference', type: 'route' },
  { label: 'Support', href: '/support', type: 'route' },
] as const;

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const NavLink = ({
    link,
    mobile = false,
  }: {
    link: (typeof NAV_LINKS)[number];
    mobile?: boolean;
  }) => {
    const active = location.pathname === link.href;

    const base = mobile
      ? 'flex items-center gap-4 w-full px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 uppercase tracking-widest'
      : 'relative group px-5 py-2.5 text-xs font-bold transition-all duration-300 rounded-xl uppercase tracking-[0.2em]';

    const colors = active
      ? mobile
        ? 'bg-accent/10 text-accent border border-accent/20'
        : 'text-accent'
      : mobile
        ? 'text-text-secondary hover:bg-accent/5 hover:text-text-primary'
        : 'text-text-secondary hover:text-accent';

    return (
      <Link to={link.href} className={cn(base, colors)}>
        {link.label}
        {!mobile && active && (
          <motion.div
            layoutId="nav-active-glow"
            className="absolute inset-0 bg-accent/5 border border-accent/20 rounded-xl -z-10 shadow-[0_0_15px_rgba(0,242,255,0.1)]"
          />
        )}
        {!mobile && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    );
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6",
          scrolled ? "pt-4" : "pt-8"
        )}
      >
        <div className={cn(
          "max-w-7xl mx-auto rounded-[2rem] transition-all duration-700 relative overflow-hidden",
          scrolled
            ? "bg-bg-primary/80 backdrop-blur-2xl border border-accent/20 shadow-2xl py-3"
            : "bg-transparent py-5"
        )}>
          {/* Top Edge Glow */}
          <div className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent to-transparent transition-opacity duration-700",
            scrolled ? "opacity-100" : "opacity-0"
          )} />

          <div className="flex items-center justify-between px-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-xl bg-accent shadow-[0_0_20px_var(--color-accent-glow)] flex items-center justify-center transition-transform group-hover:scale-110 overflow-hidden">
                 <img 
                   src={LOGO_URL} 
                   alt="ScholarAI Logo" 
                   className="w-8 h-8 object-contain"
                 />
               </div>
               <span className="text-2xl font-bold tracking-tighter text-text-primary uppercase group-hover:text-accent transition-colors">ScholarAI</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} link={link} />
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-3 bg-accent text-primary-foreground px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_var(--color-accent-glow)] hover:scale-105 active:scale-95 transition-all group"
              >
                Launch_Terminal
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-primary-foreground transition-all"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-6 right-6 mt-4 bg-bg-primary/95 backdrop-blur-3xl border border-accent/20 rounded-[2.5rem] p-8 shadow-2xl lg:hidden z-50"
            >
              <div className="space-y-4 mb-8">
                {NAV_LINKS.map((link) => (
                  <NavLink key={link.href} link={link} mobile />
                ))}
              </div>
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-4 bg-accent text-primary-foreground py-6 rounded-3xl font-bold text-sm uppercase tracking-[0.3em] shadow-[0_0_40px_var(--color-accent-glow)]"
              >
                Initialize Dashboard <ArrowRight size={18} />
              </Link>
              <div className="mt-8 pt-8 border-t border-accent/10 flex justify-between items-center px-4">
                <div className="flex gap-4">
                  <Shield size={16} className="text-accent" />
                  <Zap size={16} className="text-accent" />
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">SCHOLAR_AI_SECURE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-24" />
    </>
  );
}
