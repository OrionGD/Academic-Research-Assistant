import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';

const NAV_LINKS = [
  { label: 'Home',     href: '/',         type: 'route' },
  { label: 'Features', href: '#features', type: 'anchor' },
  { label: 'Demo',     href: '#demo',     type: 'anchor' },
  { label: 'Pricing',  href: '/pricing',  type: 'route' },
  { label: 'Contact',  href: '/support',  type: 'route' },
] as const;

export default function LandingNavbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const location = useLocation();

  /* ── scroll detection ──────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── hash tracking ─────────────────────────────────────────── */
  useEffect(() => {
    setActiveHash(window.location.hash);
    const onHash = () => setActiveHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* ── close mobile on route change ─────────────────────────── */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (link: (typeof NAV_LINKS)[number]) => {
    if (link.type === 'route') return location.pathname === link.href;
    return activeHash === link.href;
  };

  /* ── individual nav link ───────────────────────────────────── */
  const NavLink = ({
    link,
    mobile = false,
  }: {
    link: (typeof NAV_LINKS)[number];
    mobile?: boolean;
  }) => {
    const active = isActive(link);

    const base = mobile
      ? 'flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'
      : 'relative group px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl';

    const colors = active
      ? mobile
        ? 'bg-red-50 text-accent-primary font-semibold'
        : 'text-accent-primary'
      : mobile
      ? 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
      : 'text-slate-600 hover:text-slate-900';

    const inner = (
      <>
        {mobile && active && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
        )}
        {link.label}
        {!mobile && (
          <>
            {/* animated underline */}
            <span
              className={cn(
                'absolute bottom-1 left-4 right-4 h-px rounded-full bg-accent-primary transition-transform duration-300 origin-left',
                active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
              )}
            />
            {/* active dot */}
            {active && (
              <motion.span
                layoutId="nav-active-dot"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary"
              />
            )}
          </>
        )}
      </>
    );

    return link.type === 'route' ? (
      <Link to={link.href} className={cn(base, colors)}>
        {inner}
      </Link>
    ) : (
      <a
        href={link.href}
        className={cn(base, colors)}
        onClick={() => setActiveHash(link.href)}
      >
        {inner}
      </a>
    );
  };

  return (
    <>
      {/* ── Floating pill navbar ─────────────────────────────── */}
      <motion.div
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
      >
        {/* Ambient glow halo behind pill (intensifies on scroll) */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none transition-opacity duration-700',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        >
          <div className="absolute inset-x-[12%] inset-y-[-4px] blur-2xl rounded-3xl"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.10) 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Glass pill container ──────────────────────────── */}
        <div
          className={cn(
            'relative w-full max-w-5xl rounded-2xl border transition-all duration-500',
            scrolled
              ? 'border-white/60 shadow-[0_8px_40px_rgba(15,23,42,0.10),0_0_0_1px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]'
              : 'border-white/40 shadow-[0_4px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]',
          )}
          style={{
            background: scrolled
              ? 'rgba(255,255,255,0.82)'
              : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* subtle top-edge tint line */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-px rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.25), transparent)' }}
            aria-hidden="true"
          />

          <div className="flex items-center justify-between px-4 py-2.5">

            {/* ── Logo ───────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <motion.img
                src="/logo.png"
                alt="ARAS logo"
                width={36}
                height={36}
                className="rounded-xl object-contain"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(220,38,38,0.25))' }}
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-base tracking-tight text-text-primary">
                  ScholarAI
                </span>
                <span className="text-[9px] font-semibold text-text-muted tracking-widest uppercase leading-tight">
                  Research Assistant
                </span>
              </div>
            </Link>

            {/* ── Desktop nav ─────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} link={link} />
              ))}
            </nav>

            {/* ── Desktop CTAs ────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-white/80 transition-all duration-200"
              >
                Login
              </Link>

              {/* Primary CTA — glassmorphism red pill */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              >
                {/* Glow halo */}
                <div
                  className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #DC2626, #F87171)' }}
                  aria-hidden="true"
                />
                <Link
                  to="/signup"
                  className="relative flex items-center gap-1.5 text-white px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                    boxShadow: '0 4px 14px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  Get Started
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            </div>

            {/* ── Mobile hamburger ─────────────────────────────── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          {/* ── Mobile drawer ─────────────────────────────────── */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-white/50 md:hidden"
              >
                <div className="px-3 py-3 space-y-1">
                  {NAV_LINKS.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ x: -12, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <NavLink link={link} mobile />
                    </motion.div>
                  ))}
                  <div className="pt-3 pb-1 border-t border-white/40 flex flex-col gap-2 mt-2">
                    <Link
                      to="/login"
                      className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200/70 rounded-xl hover:bg-white/70 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-full text-sm font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                        boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                      }}
                    >
                      Get Started <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Spacer so content clears the floating navbar */}
      <div className="h-20" aria-hidden="true" />
    </>
  );
}
