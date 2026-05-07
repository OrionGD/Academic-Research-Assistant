import React from 'react';
import { motion } from 'motion/react';
import { Mail, Shield, Lock, FileText, ChevronRight, ArrowLeft, Monitor, ShieldCheck, ArrowRight, Cpu, Database, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import LandingNavbar from '../shared/components/LandingNavbar';
import {
  FuturisticCard,
  NeonBadge,
  SectionDivider,
  HolographicPanel,
  FuturisticHeading
} from '../shared/components/FuturisticUI';
import { FuturisticBackground } from '../shared/components/FuturisticBackground';

const SystemPage: React.FC = () => {
  const { darkMode } = useAppStore();
  const { hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="landing-page-root min-h-screen bg-bg-primary transition-colors duration-700 font-sans selection:bg-accent/20" data-theme={darkMode ? 'dark' : 'light'}>
      <FuturisticBackground />
      <LandingNavbar />

      <main className="pt-24 lg:pt-40 pb-20 px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Link to="/" className="inline-flex items-center gap-3 text-accent hover:gap-5 transition-all mb-16 font-mono text-xs font-bold uppercase tracking-[0.3em] group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> // RETURN_TO_COMMAND_HOME
          </Link>

          <header className="mb-24">
            <FuturisticHeading subtitle="System Directory" align="left">
              Command Deck & Legal <span className="text-accent">Framework</span>
            </FuturisticHeading>
            <p className="text-base md:text-xl text-text-secondary max-w-3xl leading-relaxed mt-4">
              Comprehensive information about ScholarAI operations, neural security protocols, and architectural foundations.
            </p>
          </header>

          <div className="space-y-32">
            {/* ── COMPANY & OPERATIONS ────────────────────────────── */}
            <section id="company" className="scroll-mt-40">
              <HolographicPanel title="OPERATIONS_MANIFEST_V1.0">
                <div className="grid md:grid-cols-2 gap-16 p-4">
                  <div className="space-y-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-4 tracking-tighter">
                      <Cpu size={24} className="text-accent" /> Mission Intelligence
                    </h3>
                    <p className="text-base md:text-lg text-text-secondary leading-relaxed">
                      ScholarAI is dedicated to democratizing advanced research intelligence. Our mission is to provide high-performance, open-access tools that enable researchers to navigate academic knowledge with unprecedented speed and precision.
                    </p>
                    <div className="p-6 rounded-2xl bg-accent/5 border-l-4 border-accent">
                      <p className="text-text-secondary text-sm leading-relaxed italic">
                        Utilizing neural fallback chains (pypdf → OCR) and local MiniLM-L6 vectorization for absolute privacy.
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md p-6 lg:p-10 rounded-3xl border border-accent/20 relative group overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-6">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    </div>
                    <h3 className="font-bold text-text-primary mb-6 text-xs uppercase tracking-[0.3em] font-mono">Technical Support</h3>
                    <p className="text-text-secondary text-sm mb-10 leading-relaxed">Our engineers are available for platform integrations and custom research partnership discussions.</p>
                    <a
                      href="mailto:godfrey.cs23@krct.ac.in"
                      className="w-full inline-flex items-center justify-center gap-4 bg-accent text-primary-foreground px-8 py-5 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-[0_0_30px_var(--color-accent-glow)] group"
                    >
                      <Mail size={18} /> INITIALIZE_CONTACT
                    </a>
                  </div>
                </div>
              </HolographicPanel>
            </section>

            <SectionDivider />

            {/* ── DOCUMENTATION ──────────────────────────────────── */}
            <section id="docs" className="scroll-mt-40">
              <FuturisticHeading subtitle="Archives" align="left">
                Technical <span className="text-accent">Documentation</span>
              </FuturisticHeading>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { id: 'api-reference', title: 'API Reference', desc: 'REST API documentation for ingestion and chat.', icon: Server },
                  { id: 'user-guide', title: 'Operator Manual', desc: 'Comprehensive instructions for research teams.', icon: Monitor },
                  { id: 'system-architecture', title: 'Neural Pipeline', desc: 'Deep dive into RAG and vector indexing.', icon: Database },
                ].map((item) => (
                  <FuturisticCard key={item.id} className="p-10 h-full flex flex-col">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-8 border border-accent/20 shadow-[0_0_20px_var(--color-accent-glow)]">
                      <item.icon size={28} />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary mb-4 tracking-tight">{item.title}</h4>
                    <p className="text-sm text-text-secondary mb-10 flex-1 leading-relaxed">{item.desc}</p>
                    <Link
                      to={`/documentation/${item.id}`}
                      className="inline-flex items-center gap-3 text-accent text-[10px] font-bold uppercase tracking-[0.3em] hover:gap-5 transition-all group"
                    >
                      ACCESS_LOGS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </FuturisticCard>
                ))}
              </div>
            </section>

            {/* ── SECURITY ──────────────────────────────────────────── */}
            <section id="security" className="scroll-mt-40">
              <HolographicPanel title="SECURITY_PROTOCOL_OVERRIDE">
                <div className="grid md:grid-cols-3 gap-12 py-6">
                  {[
                    { icon: Lock, title: 'Sessionless', desc: 'Anonymous architecture eliminates credential attack vectors.' },
                    { icon: Shield, title: 'Local Vault', desc: 'Documents and embeddings stay in your local DB instances.' },
                    { icon: Monitor, title: 'Edge Logic', desc: 'Sensitive extraction and embedding happen on-device.' },
                  ].map((s, i) => (
                    <div key={i} className="space-y-6 group">
                      <div className="text-accent group-hover:scale-110 transition-transform duration-500"><s.icon size={32} /></div>
                      <h4 className="font-bold text-text-primary text-xs uppercase tracking-[0.3em] font-mono">{s.title}</h4>
                      <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-16 pt-12 border-t border-accent/10 grid md:grid-cols-2 gap-16">
                  <div>
                    <NeonBadge className="mb-6">Data Retention</NeonBadge>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Documents in MongoDB are purged alongside vector embeddings in ChromaDB upon deletion, ensuring zero-footprint research.
                    </p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-2xl border border-accent/20 font-mono text-[10px] text-accent/80 shadow-inner">
                    <div className="flex justify-between mb-3 border-b border-accent/10 pb-2"><span>{">"} STATUS:</span> <span className="text-emerald-500 font-bold underline shadow-[0_0_10px_rgba(16,185,129,0.3)]">ENCRYPTED</span></div>
                    <div className="flex justify-between mb-3 border-b border-accent/10 pb-2"><span>{">"} STORAGE:</span> <span className="font-bold">LOCAL_ONLY</span></div>
                    <div className="flex justify-between"><span>{">"} ACCESS:</span> <span className="font-bold">OPEN_PROTOCOL</span></div>
                  </div>
                </div>
              </HolographicPanel>
            </section>

            {/* ── LEGAL ──────────────────────────────────────────── */}
            <section id="legal" className="scroll-mt-40 pt-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                <div className="space-y-6 lg:space-y-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-4 tracking-tighter">
                    <div className="w-1.5 h-6 lg:w-2 lg:h-8 bg-accent rounded-full shadow-[0_0_15px_var(--accent)]" />
                    Privacy Policy
                  </h2>
                  <div className="bg-accent/5 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-accent/10 text-sm lg:text-base text-text-secondary leading-relaxed space-y-4 lg:space-y-6 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 hidden lg:block"><Shield size={120} /></div>
                    <p className="text-[10px] font-mono font-bold text-accent tracking-[0.4em] uppercase">LAST_UPDATE: 2026.04.25</p>
                    <p>
                      ScholarAI respects the privacy of our users. Because we are designed for anonymous use, we do not require user registration or identification.
                    </p>
                    <p>
                      Uploaded documents are processed solely for semantic analysis and stored locally on your infrastructure. We collect no personal information.
                    </p>
                  </div>
                </div>

                <div className="space-y-6 lg:space-y-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-4 tracking-tighter">
                    <div className="w-1.5 h-6 lg:w-2 lg:h-8 bg-accent rounded-full shadow-[0_0_15px_var(--accent)]" />
                    Terms of Service
                  </h2>
                  <div className="bg-accent/5 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-accent/10 text-sm lg:text-base text-text-secondary leading-relaxed space-y-4 lg:space-y-6 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 hidden lg:block"><Lock size={120} /></div>
                    <p className="text-[10px] font-mono font-bold text-accent tracking-[0.4em] uppercase">STATUS: COMPLIANT</p>
                    <p>
                      Users retain all rights to uploaded documents. ScholarAI claims no ownership over research papers or derived insights.
                    </p>
                    <p>
                      Liability Disclosure: AI-generated insights should be verified against original sources. ScholarAI is not liable for research errors.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-32 bg-accent/5 backdrop-blur-xl border-t border-accent/10 relative overflow-hidden mt-32">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-20 mb-20">
            <div>
              <h4 className="font-bold text-[10px] mb-10 text-text-muted uppercase tracking-[0.4em] font-mono">Navigation</h4>
              <ul className="space-y-6 text-text-secondary text-sm font-bold uppercase tracking-widest">
                <li><Link to="/system#company" className="hover:text-accent transition-colors flex items-center gap-3">Company Console <ArrowRight size={16} /></Link></li>
                <li><Link to="/system#docs" className="hover:text-accent transition-colors flex items-center gap-3">Documentation Archives <ArrowRight size={16} /></Link></li>
              </ul>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-7xl font-bold text-accent opacity-10 tracking-tighter select-none font-mono">SCHOLAR_AI_SYSTEM</div>
            </div>
          </div>
          <div className="pt-12 border-t border-accent/10 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-[10px] text-text-muted tracking-[0.2em] uppercase">
            <p>© 2026 SCHOLAR_AI_INTELLIGENCE // CORE_V4.2</p>
            <div className="flex gap-10">
              <span className="flex items-center gap-3 font-bold"><ShieldCheck size={16} className="text-accent" /> OPEN_PROTOCOL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SystemPage;
