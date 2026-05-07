import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  MessageSquare,
  Shield,
  Zap,
  FileText,
  Layers,
  CheckCircle2,
  Lock,
  Cpu,
  Database,
  Server,
  BookOpen,
  Activity,
  ShieldCheck,
  GitCompare,
  Mail,
  Send
} from 'lucide-react';
import { motion } from 'motion/react';
import HeroSection from '../shared/components/HeroSection';
import LandingNavbar from '../shared/components/LandingNavbar';
import { LOGO_URL } from '../shared/components/Logo';
import { useAppStore } from '../store/useAppStore';
import {
  FuturisticCard,
  NeonBadge,
  SectionDivider,
  HolographicPanel,
  FuturisticHeading
} from '../shared/components/FuturisticUI';
import { FuturisticBackground } from '../shared/components/FuturisticBackground';

export default function LandingPage() {
  const { darkMode } = useAppStore();
  const theme = darkMode ? 'dark' : 'light';

  return (
    <div className="landing-page-root min-h-screen bg-bg-primary font-sans selection:bg-accent/20 selection:text-accent overflow-x-hidden" data-theme={theme}>

      {/* ── BACKGROUND SYSTEM ──────────────────────────────────── */}
      <FuturisticBackground />

      {/* ── NAVIGATION ──────────────────────────────────────────── */}
      <LandingNavbar />

      <main className="relative z-10">
        {/* ── HERO ────────────────────────────────────────────────── */}
        <HeroSection />

        {/* ── POWERED BY ─────────────────────────────────────────── */}
        <section className="py-16 border-y border-accent/10 bg-accent/5 backdrop-blur-md relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left">
                Powered by industry-leading <span className="text-accent">AI & High-performance infrastructure</span>
                {/* <p className="text-text-primary font-bold text-sm tracking-tight">Powered by industry-leading AI and high-performance infrastructure.</p> */}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                {[
                  { icon: Cpu, label: 'Google Gemini 2.0', color: 'hover:text-accent' },
                  { icon: Zap, label: 'Groq Llama 3.1', color: 'hover:text-amber-400' },
                  { icon: Database, label: 'ChromaDB', color: 'hover:text-blue-400' },
                  { icon: Activity, label: 'FastAPI', color: 'hover:text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 group cursor-default ${item.color}`}>
                    <item.icon size={22} className="transition-colors duration-500" />
                    <span className="font-bold text-sm tracking-widest text-text-primary uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM SECTION ─────────────────────────────────────── */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <FuturisticHeading subtitle="The Challenge" align="left">
                  The Research <span className="text-accent">Bottleneck</span>
                </FuturisticHeading>
                <p className="text-xl text-text-secondary mb-12 leading-relaxed">
                  Researchers spend over 40% of their time on paper discovery and management — not actual research. Each paper takes 3–5 hours to analyze manually, and 15–25% of citations contain errors.
                </p>
                <div className="space-y-6 mb-12">
                  {[
                    'Manual paper reading averaging 3–5 hours per paper',
                    'Keyword-only search missing semantically similar papers',
                    'Switching between 5–10 disconnected research tools',
                    'Citation errors at 15–25% with manual formatting',
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-5 text-text-secondary font-medium group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-sm font-bold">×</span>
                      </div>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <HolographicPanel title="SYSTEM_DIAGNOSTICS_V4.2">
                  <div className="space-y-6">
                    {[
                      { label: 'Time on discovery & mgmt', val: '40%', color: 'text-accent' },
                      { label: 'Hours per paper (manual)', val: '3–5h', color: 'text-text-primary' },
                      { label: 'Citation error rate', val: '25%', color: 'text-text-muted' },
                      { label: 'Tools per researcher', val: '5–10', color: 'text-accent' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-accent/5 rounded-2xl border border-accent/10 hover:border-accent/30 transition-all group">
                        <span className="text-text-secondary text-sm font-bold uppercase tracking-widest">{stat.label}</span>
                        <span className={`text-sm font-mono font-bold px-4 py-2 rounded-xl bg-black/20 shadow-inner ${stat.color}`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </HolographicPanel>
              </motion.div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── PRODUCT INTRO (4 PILLARS) ───────────────────────────── */}
        <section className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FuturisticHeading subtitle="What We Do">
              Your Intelligent Academic Research Assistant
            </FuturisticHeading>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Document Extraction', desc: 'Automatically extracts text, metadata, authors, abstract, and full structure from any uploaded PDF.', icon: Layers },
                { title: 'AI-Powered Analysis', desc: 'Generates comprehensive summaries, methodology breakdowns, key concepts, research highlights, and citation management.', icon: Zap },
                { title: 'Semantic Indexing', desc: 'SentenceTransformer vector embeddings enable natural language queries with 85%+ accuracy.', icon: Search },
                { title: 'Research Chat', desc: 'Context-aware AI conversations with cited answers, follow-up question support, and history preservation.', icon: MessageSquare },
              ].map((item, i) => (
                <FuturisticCard key={i} delay={i * 0.1} className="p-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 text-accent shadow-[0_0_20px_var(--color-accent-glow)]">
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-text-primary tracking-tight">{item.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed flex-1">{item.desc}</p>
                </FuturisticCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── CORE FEATURES ───────────────────────────────────────── */}
        <section id="features" className="py-32 bg-accent/5 backdrop-blur-sm relative">
          <div className="max-w-7xl mx-auto px-6">
            <FuturisticHeading subtitle="Deep Dive">
              Core <span className="text-accent">Features</span>
            </FuturisticHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* AI Document Analysis - Spans 2 cols */}
              <div className="md:col-span-2">
                <HolographicPanel title="MODULE_ANALYSIS_ENGINE" className="h-full">
                  <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1">
                      <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-8 shadow-[0_0_30px_var(--color-accent-glow)]">
                        <FileText size={32} />
                      </div>
                      <h3 className="text-4xl font-bold text-text-primary mb-6 tracking-tighter">AI Document Analysis</h3>
                      <p className="text-text-secondary text-lg leading-relaxed mb-10">
                        Upload any research paper and instantly receive a structured breakdown — saving hours of manual reading.
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {['Comprehensive summary', 'Key insights & contributions', 'Methodology breakdown', 'Results interpretation'].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-text-secondary text-sm font-bold tracking-tight">
                            <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1 w-full bg-black/60 rounded-3xl p-8 border border-accent/20 font-mono text-xs text-accent/80 shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                      <div className="opacity-40 mb-3 text-[10px]">// research_pipeline.ts</div>
                      <div className="text-blue-400">async function <span className="text-white font-bold">processDocument</span>(doc: PDF) {"{"}</div>
                      <div className="pl-6 text-purple-400">const <span className="text-white">insights</span> = await neuralEngine.analyze(doc);</div>
                      <div className="pl-6 text-text-muted mt-2">// Extract semantic map</div>
                      <div className="pl-6">return {"{"}</div>
                      <div className="pl-12 text-green-400">summary: insights.getSummary(),</div>
                      <div className="pl-12 text-green-400">methodology: insights.getMethodology(),</div>
                      <div className="pl-12 text-green-400">accuracy: <span className="text-white">"98.4%"</span></div>
                      <div className="pl-6">{"};"}</div>
                      <div className="text-blue-400">{"}"}</div>
                    </div>
                  </div>
                </HolographicPanel>
              </div>

              {/* Semantic Research Search */}
              <FuturisticCard className="p-10 flex flex-col">
                <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-8">
                  <Search size={28} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4 tracking-tighter">Semantic Search</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-10 flex-1">
                  Vector embeddings and cosine similarity to understand meaning, not just words. Ranked by relevance score across your library.
                </p>
                <div className="bg-black/20 p-6 rounded-2xl border border-accent/10 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 text-accent/60 text-[10px] font-mono font-bold uppercase tracking-widest">
                    <Search size={12} />
                    <span>Query:: "Neural Architectures"</span>
                  </div>
                  <div className="space-y-3">
                    <motion.div animate={{ width: ['100%', '85%', '100%'] }} transition={{ duration: 4, repeat: Infinity }} className="h-2 bg-accent rounded-full shadow-[0_0_15px_var(--accent)]" />
                    <div className="h-2 w-4/5 bg-accent/40 rounded-full" />
                    <div className="h-2 w-3/5 bg-accent/20 rounded-full" />
                  </div>
                </div>
              </FuturisticCard>

              {/* AI Research Chat */}
              <div className="md:col-span-1">
                <FuturisticCard className="p-10 h-full flex flex-col">
                  <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-8">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-4 tracking-tighter">AI Research Chat</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-10">
                    Ask complex questions and receive contextual answers sourced directly from your uploaded papers.
                  </p>
                  <div className="space-y-6 font-mono text-[11px] bg-black/40 p-6 rounded-2xl border border-accent/10">
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">[USER]:</span>
                      <span className="text-white/80">How does this model handle sparsity?</span>
                    </div>
                    <div className="flex items-start gap-3 pl-4 border-l-2 border-accent/30 py-1">
                      <span className="text-accent/60 font-bold">[ScholarAI]:</span>
                      <span className="text-text-secondary leading-relaxed italic">The system utilizes L1 regularization to enforce sparse weights, as detailed on page 14...</span>
                    </div>
                  </div>
                </FuturisticCard>
              </div>

              {/* Cross-Paper Comparison */}
              <div className="md:col-span-2">
                <FuturisticCard className="p-10 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1">
                    <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-8">
                      <GitCompare size={28} />
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mb-4 tracking-tighter">Cross-Paper Comparison</h3>
                    <p className="text-text-secondary text-base leading-relaxed mb-10">
                      Compare multiple research papers side-by-side with AI-generated comparative analysis highlighting novel opportunities.
                    </p>
                    <Link to="/dashboard" className="inline-flex items-center gap-3 text-accent font-bold text-xs uppercase tracking-[0.2em] hover:gap-5 transition-all group">
                      Launch Analysis Terminal <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="flex-1 w-full p-10 relative">
                    <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full" />
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                      <div className="h-40 rounded-2xl border-2 border-accent/30 bg-accent/5 flex flex-col items-center justify-center font-mono text-[11px] text-accent font-bold uppercase tracking-widest gap-2 shadow-2xl">
                        <FileText size={24} />
                        PAPER_ALPHA
                      </div>
                      <div className="h-40 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center font-mono text-[11px] text-text-muted uppercase tracking-widest gap-2">
                        <FileText size={24} />
                        PAPER_BETA
                      </div>
                    </div>
                  </div>
                </FuturisticCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <FuturisticHeading subtitle="Deployment">
              Mission <span className="text-accent">Workflow</span>
            </FuturisticHeading>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: '01', title: 'Data Ingestion', desc: 'Securely upload PDFs. System extracts metadata and chunks content into semantic units.', icon: FileText },
                { step: '02', title: 'Neural Indexing', desc: 'SentenceTransformer generates 384-dimensional embeddings for sub-second recall.', icon: Zap },
                { step: '03', title: 'Intelligence Output', desc: 'Query your library, chat with papers, or generate structured comparison reports.', icon: BookOpen },
              ].map((item, i) => (
                <div key={i} className="group relative p-8 rounded-3xl hover:bg-accent/5 transition-all duration-500 border border-transparent hover:border-accent/10">
                  <div className="w-20 h-20 rounded-2xl bg-bg-surface border-2 border-accent/10 flex items-center justify-center mb-10 group-hover:border-accent group-hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-all duration-500">
                    <item.icon className="text-text-muted group-hover:text-accent transition-colors duration-500" size={40} />
                  </div>
                  <div className="text-xs font-mono font-bold text-accent mb-3 tracking-[0.3em]">SEQUENCE::{item.step}</div>
                  <h4 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">{item.title}</h4>
                  <p className="text-text-secondary text-base leading-relaxed">{item.desc}</p>
                  {i < 2 && (
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="hidden lg:block absolute top-12 -right-8 text-accent/20"
                    >
                      <ArrowRight size={32} />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────── */}
        <section className="py-24 border-y border-accent/10 bg-accent/5 backdrop-blur-md relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { value: '40–60%', label: 'Efficiency Gain', icon: Activity },
                { value: '<500ms', label: 'Inference Latency', icon: Zap },
                { value: '85%+', label: 'Search Recall', icon: Search },
                { value: '99.5%', label: 'System Uptime', icon: ShieldCheck },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="text-5xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors tracking-tighter duration-500">{stat.value}</div>
                  <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-[0.3em]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECURITY ──────────────────────────────────────────── */}
        <section id="security" className="py-32">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <FuturisticHeading subtitle="Protocol">
              Security & <span className="text-accent">Privacy</span>
            </FuturisticHeading>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
              {[
                { icon: Lock, title: 'Sessionless', desc: 'Stateless architecture eliminates credential theft risk.' },
                { icon: Database, title: 'Local Vault', desc: 'All documents stay in your local MongoDB/ChromaDB instances.' },
                { icon: Cpu, title: 'Edge Embed', desc: 'Vectorization happens locally via HuggingFace models.' },
                { icon: ShieldCheck, title: 'Zero-Retention', desc: 'Strict no-training policies for all AI inference pipelines.' },
              ].map((card, i) => (
                <FuturisticCard key={i} delay={i * 0.1} className="p-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-8 text-accent">
                    <card.icon size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-4 tracking-tight">{card.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{card.desc}</p>
                </FuturisticCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION (SPLIT LAYOUT) ─────────────────────────── */}
        <section className="py-40 bg-accent/5 backdrop-blur-xl border-t border-accent/10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Left Content */}
              <div>
                <NeonBadge className="mb-8">System Ready</NeonBadge>
                <h2 className="text-5xl md:text-7xl font-bold text-text-primary mb-10 tracking-tighter leading-[1.1]">
                  Initialize Your <br />
                  <span className="text-accent">Research Mission</span>
                </h2>
                <p className="text-xl text-text-secondary mb-12 max-w-xl leading-relaxed">
                  Experience the future of academic intelligence. Launch the ScholarAI command terminal and transform your research workflow today.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-4 bg-accent text-primary-foreground px-12 py-6 rounded-2xl font-bold text-xl shadow-[0_0_50px_var(--color-accent-glow)] hover:shadow-[0_0_70px_rgba(0,242,255,0.6)] transition-all hover:scale-105 active:scale-95 group"
                >
                  Launch Command Terminal
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>

              {/* Right Form (The requested "previous web form") */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <HolographicPanel title="COMMUNICATION_UPLINK" className="p-10">
                  <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                      const formData = new FormData(form);
                      formData.append("access_key", "390b5436-d7ef-4af2-8475-0fa21ebc59ee");

                      const originalText = submitBtn.textContent;
                      submitBtn.textContent = "Sending...";
                      submitBtn.disabled = true;

                      try {
                        const response = await fetch("https://api.web3forms.com/submit", {
                          method: "POST",
                          body: formData
                        });

                        const data = await response.json();

                        if (response.ok) {
                          alert("Success! Your message has been sent.");
                          form.reset();
                        } else {
                          alert("Error: " + data.message);
                        }
                      } catch (error) {
                        alert("Something went wrong. Please try again.");
                      } finally {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest ml-1">Operator_ID</label>
                        <input
                          name="name"
                          type="text"
                          required
                          placeholder="Name"
                          className="w-full bg-black/20 border border-accent/20 rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest ml-1">Network_Address</label>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="Email"
                          className="w-full bg-black/20 border border-accent/20 rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest ml-1">Transmission_Payload</label>
                      <textarea
                        name="message"
                        rows={4}
                        required
                        placeholder="Your mission requirements..."
                        className="w-full bg-black/20 border border-accent/20 rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-accent/10 border border-accent/30 text-accent font-bold py-5 rounded-xl uppercase tracking-[0.3em] text-xs hover:bg-accent hover:text-primary-foreground transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                      Initialize_Transmission
                    </button>
                    <div className="flex items-center justify-center gap-3 pt-4 opacity-40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">End-to-End Encrypted Signal</span>
                    </div>
                  </form>
                </HolographicPanel>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="py-32 border-t border-accent/10 relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-accent shadow-[0_0_20px_var(--accent)] overflow-hidden flex items-center justify-center">
                    <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-3xl font-bold tracking-tighter text-text-primary uppercase">ScholarAI</span>
                </div>
                <p className="text-text-secondary text-base leading-relaxed">
                  Open-access Intelligent Academic Research Assistant. Precision-engineered for global research collaboration and secure knowledge management.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-xs mb-8 text-text-muted uppercase tracking-[0.3em]">Access Portals</h4>
                <ul className="space-y-5 text-text-secondary text-sm">
                  <li><Link to="/dashboard" className="hover:text-accent transition-colors flex items-center gap-3 font-bold uppercase tracking-wider">Platform Dashboard <ArrowRight size={14} /></Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xs mb-8 text-text-muted uppercase tracking-[0.3em]">Information</h4>
                <ul className="space-y-5 text-text-secondary text-sm font-bold uppercase tracking-wider">
                  <li><Link to="/system" className="hover:text-accent transition-colors">System Architecture</Link></li>
                  <li><Link to="/documentation/api-reference" className="hover:text-accent transition-colors">Documentation</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xs mb-8 text-text-muted uppercase tracking-[0.3em]">Security</h4>
                <ul className="space-y-5 text-text-secondary text-[10px] font-mono">
                  <li className="flex items-center gap-3 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM_STABLE</li>
                  <li className="flex items-center gap-3 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500" /> SSL_ENCRYPTED</li>
                  <li className="flex items-center gap-3 text-accent"><div className="w-2 h-2 rounded-full bg-accent" /> RAG_ACTIVE</li>
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-accent/10 flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.3em]">© 2026 SCHOLAR_AI_SYSTEM // ALL_RIGHTS_RESERVED</p>
              <div className="flex gap-10 text-text-muted text-[10px] font-mono">
                <span className="flex items-center gap-2 uppercase"><Lock size={14} className="text-blue-500" /> AES_256_VAULT</span>
                <span className="flex items-center gap-2 uppercase"><ShieldCheck size={14} className="text-accent" /> OPEN_SOURCE_CORE</span>
              </div>
            </div>
          </div>
        </footer>
      </main>

    </div>
  );
}
