import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  MessageSquare,
  Shield,
  Zap,
  FileText,
  Layers,
  Users,
  CheckCircle2,
  Lock,
  Cpu,
  Database,
  Server,
  ChevronRight,
  BookOpen,
  Activity,
  ShieldCheck,
  GitCompare,
  Play,
} from 'lucide-react';
import Logo from '../shared/components/Logo';
import { motion } from 'motion/react';
import HeroSection from '../shared/components/HeroSection';
import LandingNavbar from '../shared/components/LandingNavbar';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};



export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary font-sans selection:bg-accent-primary/10 selection:text-accent-primary">

      {/* ── NAVIGATION ──────────────────────────────────────────── */}
      <LandingNavbar />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── TRUST / CREDIBILITY BAR ─────────────────────────────── */}
      <section className="py-10 border-y border-surface-light bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <p className="text-text-muted font-semibold text-xs uppercase tracking-wider mb-1">Empowering Open Research</p>
              <p className="text-text-primary font-bold">Graduate students, faculty, and research teams worldwide.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-50 grayscale hover:opacity-100 transition-all duration-500 text-white">
              <div className="flex items-center gap-2.5">
                <Database className="text-white/80" size={22} />
                <span className="font-bold text-base tracking-tight text-white">MongoDB Atlas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Cpu className="text-white/80" size={22} />
                <span className="font-bold text-base tracking-tight text-white">Google Gemini</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Activity className="text-white/80" size={22} />
                <span className="font-bold text-base tracking-tight text-white">FastAPI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ─────────────────────────────────────── */}
      <section className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInUp}>
              <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-4 block">The Challenge</span>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-8 tracking-tight leading-tight">The Research Bottleneck</h2>
              <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                Researchers spend over 40% of their time on paper discovery and management — not actual research. Each paper takes 3–5 hours to analyze manually, and 15–25% of citations contain errors.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  'Manual paper reading averaging 3–5 hours per paper',
                  'Keyword-only search missing semantically similar papers',
                  'Switching between 5–10 disconnected research tools',
                  'Citation errors at 15–25% with manual formatting',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-text-secondary font-medium">
                    <div className="w-6 h-6 rounded-full bg-bg-surface border border-rose-200 flex items-center justify-center text-rose-500 flex-shrink-0">
                      <span className="text-sm font-bold">×</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-base font-semibold text-text-primary flex items-center gap-2.5">
                <CheckCircle2 className="text-status-success flex-shrink-0" size={20} />
                ScholarAI replaces fragmented manual workflows with a unified AI-driven research platform.
              </p>
            </motion.div>

            <motion.div {...fadeInUp} className="relative">
              <div className="bg-bg-primary rounded-3xl p-8 shadow-xl border border-surface-light relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-teal-400 rounded-t-3xl"></div>
                <div className="space-y-5">
                  {[
                    { label: 'Time on discovery & mgmt', val: '40%', color: 'bg-border-main text-rose-600' },
                    { label: 'Hours per paper (manual)', val: '3–5h', color: 'bg-border-main text-indigo-600' },
                    { label: 'Citation error rate', val: '25%', color: 'bg-border-main text-text-secondary' },
                    { label: 'Tools per researcher', val: '5–10', color: 'bg-border-main text-blue-600' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-bg-surface rounded-2xl border border-slate-100">
                      <span className="text-text-secondary text-sm font-medium">{stat.label}</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${stat.color}`}>{stat.val}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-text-muted text-center">Average annual cost per researcher: <strong className="text-text-primary">$15,000–$30,000</strong></p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-accent-primary/10 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT INTRO (4 PILLARS) ───────────────────────────── */}
      <section className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div {...fadeInUp}>
              <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">What We Do</span>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 tracking-tight">Your Intelligent Academic Research Assistant</h2>
              <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
                ScholarAI transforms static PDF papers into a living, searchable knowledge system — powered by RAG, semantic search, and conversational AI.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Document Extraction',  desc: 'Automatically extracts text, metadata, authors, abstract, and full structure from any uploaded PDF.',                                                              icon: Layers,       color: 'text-feature-blue',    bg: 'bg-bg-surface',    border: 'border-blue-100' },
              { title: 'AI-Powered Analysis',  desc: 'Generates comprehensive summaries, methodology breakdowns, key concepts, research highlights, and citation management.',                                        icon: Zap,          color: 'text-feature-indigo',  bg: 'bg-bg-surface',  border: 'border-indigo-100' },
              { title: 'Semantic Indexing',    desc: 'SentenceTransformer vector embeddings enable natural language queries with 85%+ accuracy, far beyond keyword matching.',                                       icon: Search,       color: 'text-feature-teal',    bg: 'bg-bg-surface',    border: 'border-teal-100' },
              { title: 'Research Chat',        desc: 'Context-aware AI conversations with cited answers, follow-up question support, and full conversation history preservation.',                                   icon: MessageSquare, color: 'text-feature-violet', bg: 'bg-bg-surface',  border: 'border-violet-100' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg-primary border border-surface-light p-7 rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className={`w-12 h-12 ${item.bg} border ${item.border} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <item.icon className={item.color} size={22} />
                </div>
                <h3 className="text-base font-bold mb-2 text-text-primary">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Deep Dive</span>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">Core Features</h2>
            <div className="w-16 h-1 bg-accent-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Document Analysis - Spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 blackbox-card flex flex-col overflow-hidden"
            >
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red"></div>
                <div className="terminal-dot terminal-dot-yellow"></div>
                <div className="terminal-dot terminal-dot-green"></div>
                <span className="ml-2 text-xs text-text-muted font-mono">document_analysis.py</span>
              </div>
              <div className="p-8 flex flex-col lg:flex-row gap-8 items-center h-full">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-blue mb-5">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">AI Document Analysis</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    Upload any research paper and instantly receive a structured breakdown — saving hours of manual reading.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Comprehensive summary','Key insights & contributions','Methodology breakdown','Results interpretation'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-text-secondary text-sm font-medium">
                        <CheckCircle2 className="text-status-success flex-shrink-0" size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 bg-code-bg rounded-xl p-5 border border-code-border w-full font-mono text-xs text-accent-light shadow-inner overflow-hidden">
                  <div className="text-purple-400 mb-2">import <span className="text-white">scholarai</span></div>
                  <div className="text-blue-400 mb-2">async def <span className="text-white">analyze_paper</span>(pdf_path):</div>
                  <div className="pl-4 text-text-secondary mb-2"># Extract text, tables, and methodology</div>
                  <div className="pl-4 mb-2">doc = <span className="text-purple-400">await</span> scholarai.parse(pdf_path)</div>
                  <div className="pl-4 mb-2">insights = <span className="text-purple-400">await</span> doc.generate_insights()</div>
                  <div className="pl-4 text-green-400">return <span className="text-white">insights</span></div>
                </div>
              </div>
            </motion.div>

            {/* Semantic Research Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="blackbox-card p-8 flex flex-col"
            >
              <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-teal mb-5">
                <Search size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">Semantic Search</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">
                Vector embeddings and cosine similarity to understand meaning, not just words. Ranked by relevance score across your entire library in under 1 second.
              </p>
              <div className="bg-bg-primary p-4 rounded-xl border border-border-main">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-xs">
                  <Search size={12} />
                  <span>transformer architectures</span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-accent rounded-full opacity-80"></div>
                  <div className="h-1.5 w-4/5 bg-accent rounded-full opacity-50"></div>
                  <div className="h-1.5 w-3/5 bg-accent rounded-full opacity-30"></div>
                </div>
              </div>
            </motion.div>

            {/* AI Research Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="blackbox-card flex flex-col overflow-hidden"
            >
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red"></div>
                <div className="terminal-dot terminal-dot-yellow"></div>
                <div className="terminal-dot terminal-dot-green"></div>
                <span className="ml-2 text-xs text-text-muted font-mono">chat_session.sh</span>
              </div>
              <div className="p-8 flex flex-col h-full">
                <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-violet mb-5">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">AI Research Chat</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">
                  Ask complex questions and receive contextual answers sourced directly from your uploaded papers, with page-level citations.
                </p>
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex items-start gap-2">
                    <span className="text-accent font-bold">&gt;</span>
                    <span className="text-text-primary">How does it handle class imbalance?</span>
                  </div>
                  <div className="flex items-start gap-2 pl-4">
                    <span className="text-success font-bold">[RAG]</span>
                    <span className="text-text-secondary">Authors used SMOTE oversampling [Page 14, §3.2].</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cross-Paper Comparison - Spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 blackbox-card p-8 flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-amber mb-5">
                  <GitCompare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">Cross-Paper Comparison</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  Compare multiple research papers side-by-side with AI-generated comparative analysis highlighting shared methodologies, conflicting findings, and novel opportunities.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-primary border border-border-main rounded-lg text-xs font-medium text-white">
                  <GitCompare size={14} className="text-accent-light" />
                  Dramatically accelerates literature review
                </div>
              </div>
              <div className="flex-1 w-full bg-bg-primary rounded-xl border border-border-main p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent shimmer"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="text-xs font-bold text-text-primary">Paper A</div>
                  <div className="text-xs text-text-muted">vs</div>
                  <div className="text-xs font-bold text-text-primary">Paper B</div>
                </div>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Method</div>
                    <div className="h-1.5 flex-1 bg-accent/40 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Dataset</div>
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-success/40 rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Accuracy</div>
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Process</span>
            <h2 className="text-4xl font-bold text-text-primary mb-4 tracking-tight">How It Works</h2>
            <p className="text-text-secondary">Three steps from PDF upload to research intelligence — powered by the RAG pipeline.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-surface-light to-transparent"></div>
            {[
              { step: '01', title: 'Upload your research papers', desc: 'Securely upload PDFs up to 100 MB. The system extracts text, metadata (title, authors, abstract, date), and chunks content into semantic units.', icon: FileText, color: 'text-feature-blue', bg: 'bg-bg-surface', border: 'border-blue-200' },
              { step: '02', title: 'AI processes & indexes',       desc: 'SentenceTransformer generates 384-dimensional vector embeddings per chunk. AI pipelines produce structured analysis reports in under 30 seconds.',  icon: Zap,      color: 'text-feature-indigo', bg: 'bg-bg-surface', border: 'border-indigo-200' },
              { step: '03', title: 'Explore insights instantly',   desc: 'Search with natural language (<1s response), chat with papers for cited answers, compare methodologies, or export reports.',                           icon: BookOpen, color: 'text-feature-emerald', bg: 'bg-bg-surface', border: 'border-emerald-200' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center group"
              >
                <div className={`w-16 h-16 ${item.bg} border-2 ${item.border} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                  <item.icon className={item.color} size={28} />
                </div>
                <div className="text-xs font-bold text-accent-primary uppercase tracking-widest mb-3">Step {item.step}</div>
                <h4 className="text-lg font-bold text-text-primary mb-3">{item.title}</h4>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE METRICS ─────────────────────────────────── */}
      <section className="py-20 bg-bg-primary border-y border-surface-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-2 block">By the numbers</span>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">Built for performance at scale</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { value: '40–60%', label: 'Research time saved',       sub: 'vs. traditional workflows',  icon: Activity,    color: 'text-feature-emerald', bg: 'bg-bg-surface', border: 'border-emerald-100' },
              { value: '<500ms', label: 'API response time',          sub: 'P95 across all endpoints',   icon: Zap,         color: 'text-feature-blue',    bg: 'bg-bg-surface',    border: 'border-blue-100' },
              { value: '85%+',   label: 'Semantic search accuracy',  sub: 'natural language queries',   icon: Search,      color: 'text-feature-teal',    bg: 'bg-bg-surface',    border: 'border-teal-100' },
              { value: '99.5%',  label: 'Platform uptime SLA',       sub: 'with automated backups',     icon: ShieldCheck, color: 'text-accent-highlight', bg: 'bg-bg-surface',  border: 'border-indigo-100' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg-primary border border-surface-light rounded-3xl p-7 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={`w-11 h-11 ${stat.bg} border ${stat.border} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={stat.color} size={20} />
                </div>
                <div className="text-3xl font-bold text-text-primary mb-1 tracking-tight">{stat.value}</div>
                <div className="font-semibold text-text-primary text-sm mb-1">{stat.label}</div>
                <div className="text-text-muted text-xs">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEM ARCHITECTURE ─────────────────────────────────── */}
      <section className="py-28 bg-bg-primary">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Architecture</span>
            <h2 className="text-3xl font-bold text-text-primary mb-3 tracking-tight">Three-Tier Microservices Architecture</h2>
            <p className="text-text-secondary text-sm max-w-xl mx-auto">Each layer is independently scalable, containerized with Docker, and communicates through well-defined interfaces.</p>
          </div>

          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {[
              { layer: '1', label: 'Presentation Layer', icon: Layers,   tags: ['React 19 + TypeScript','Tailwind CSS v4','Framer Motion','TanStack Query','React Router v7','Vite'], connector: 'HTTP / REST',   color: 'text-feature-blue',    bg: 'bg-bg-surface',    border: 'border-blue-200' },
              { layer: '2', label: 'Application Layer',  icon: Server,   tags: ['Python FastAPI','Redis Sessions','MongoDB Atlas','Google Gemini AI','SentenceTransformer','ARQ Workers'], connector: 'HTTP / REST', color: 'text-feature-indigo',  bg: 'bg-bg-surface',  border: 'border-indigo-200' },
              { layer: '3', label: 'Data Layer',         icon: Database, tags: ['MongoDB Atlas','Vector DB (ChromaDB)','Redis Storage','GCS File Storage'], connector: null,             color: 'text-feature-teal',    bg: 'bg-bg-surface',    border: 'border-teal-200' },
            ].map((l, i) => (
              <div key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-bg-primary border border-surface-light rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 ${l.bg} border ${l.border} rounded-xl flex items-center justify-center`}>
                      <l.icon className={l.color} size={18} />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${l.color} uppercase tracking-widest`}>Layer {l.layer}</div>
                      <div className="font-bold text-text-primary text-sm">{l.label}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.tags.map(t => (
                      <span key={t} className="px-3 py-1 bg-bg-surface border border-slate-200 rounded-lg text-xs text-text-secondary font-medium">{t}</span>
                    ))}
                  </div>
                </motion.div>
                {l.connector && (
                  <div className="flex items-center justify-center py-1.5 gap-2 text-xs text-text-muted">
                    <div className="w-px h-4 bg-surface-light"></div>
                    <ArrowRight className="text-accent-primary rotate-90" size={14} />
                    <span>{l.connector}</span>
                    <div className="w-px h-4 bg-surface-light"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-28 bg-bg-primary">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Social Proof</span>
          <h2 className="text-4xl font-bold text-text-primary mb-14 tracking-tight">Researchers Love ScholarAI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Cut my literature review time by 75%. The semantic search is game-changing.', author: 'Dr. Sarah Chen',       role: 'AI Researcher, Stanford' },
              { quote: 'The AI chat actually understands my papers. Citations are always accurate.',   author: 'Prof. Michael Rodriguez', role: 'Computer Science, MIT' },
              { quote: 'Perfect for comparing methodologies across 50+ papers. Enterprise ready.',    author: 'Dr. Elena Novak',       role: 'Head of R&D, PharmaCorp' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg-primary p-8 rounded-3xl border border-surface-light shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <div key={s} className="w-4 h-4 bg-amber-400 rounded-sm"></div>
                  ))}
                </div>
                <p className="text-text-secondary italic mb-6 leading-relaxed text-sm">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-text-primary text-sm">{t.author}</div>
                  <div className="text-text-muted text-xs mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY & PRIVACY ──────────────────────────────────── */}
      <section id="security" className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp}>
            <div className="w-16 h-16 bg-bg-surface border border-indigo-100 rounded-3xl flex items-center justify-center text-accent-highlight mx-auto mb-7">
              <Shield size={32} />
            </div>
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Enterprise-Grade</span>
            <h2 className="text-4xl font-bold text-text-primary mb-5 tracking-tight">Security & Privacy</h2>
            <p className="text-base text-text-secondary mb-16 max-w-2xl mx-auto">
              Your research data remains secure and private. All documents are stored in encrypted cloud storage with strict access controls.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {[
                { icon: Lock,       title: 'Redis Session Management',  desc: 'Secure HTTP-only session cookies with Redis storage, eliminating JWT vulnerabilities and improving security.',                    color: 'text-feature-blue',    bg: 'bg-bg-surface',    border: 'border-blue-100' },
                { icon: Cpu,        title: 'Google Gemini AI',          desc: 'Privacy-focused AI inference with grounded, citation-backed responses. No data retention.',                    color: 'text-feature-indigo',  bg: 'bg-bg-surface',  border: 'border-indigo-100' },
                { icon: Shield,     title: 'End-to-End Encryption',    desc: 'All documents stored in encrypted cloud storage (GCS/S3) with per-user strict access controls.',              color: 'text-feature-teal',    bg: 'bg-bg-surface',    border: 'border-teal-100' },
                { icon: ShieldCheck,title: 'OWASP Top 10 Compliant',   desc: 'Built to OWASP standards with rate limiting (1000 req/min), DDoS protection, and regular security audits.',   color: 'text-feature-emerald', bg: 'bg-bg-surface', border: 'border-emerald-100' },
              ].map((card, i) => (
                <div key={i} className="bg-bg-primary p-7 rounded-2xl border border-surface-light shadow-sm flex flex-col items-center group hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className={`w-12 h-12 ${card.bg} border ${card.border} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <card.icon className={card.color} size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mb-3">{card.title}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TARGET USERS ────────────────────────────────────────── */}
      <section className="py-28 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-accent-primary font-bold uppercase tracking-widest text-xs mb-3 block">Who It's For</span>
            <h2 className="text-4xl font-bold text-text-primary mb-3 tracking-tight">Designed for Knowledge-Intensive Environments</h2>
            <p className="text-text-secondary text-sm">Researchers, academics, and knowledge professionals across all disciplines.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'PhD Candidates',                  icon: Users,    color: 'text-feature-blue',    bg: 'bg-bg-surface',    border: 'border-blue-200' },
              { label: 'University Faculty',              icon: BookOpen, color: 'text-feature-indigo',  bg: 'bg-bg-surface',  border: 'border-indigo-200' },
              { label: 'Graduate Students',               icon: Users,    color: 'text-feature-teal',    bg: 'bg-bg-surface',    border: 'border-teal-200' },
              { label: 'Research Scientists',             icon: Search,   color: 'text-feature-emerald', bg: 'bg-bg-surface', border: 'border-emerald-200' },
              { label: 'Academic Librarians',             icon: Database, color: 'text-feature-violet',  bg: 'bg-bg-surface',  border: 'border-violet-200' },
              { label: 'Literature Review Professionals', icon: FileText, color: 'text-feature-amber',   bg: 'bg-bg-surface',   border: 'border-amber-200' },
            ].map((user, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`px-6 py-3.5 bg-bg-primary border ${user.border} rounded-2xl text-text-primary font-semibold text-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default flex items-center gap-2.5 shadow-sm`}
              >
                <user.icon className={user.color} size={16} />
                {user.label}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ──────────────────────────────────────── */}
      <section className="py-28 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_100%,rgba(67,56,202,0.4),transparent)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Transform the Way You Conduct Research</h2>
            <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Turn static PDF papers into a living, searchable knowledge system. Join researchers saving 40–60% of their research time with ScholarAI today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto bg-bg-primary text-indigo-600 px-9 py-4 rounded-2xl font-bold text-base hover:bg-bg-surface transition-all shadow-xl flex items-center justify-center gap-2"
              >
                Start Researching Now <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-20 bg-slate-950 text-white border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="mb-5">
                <Logo size="md" textClassName="text-xl text-white" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Open-access Intelligent Academic Research Assistant. Precision-engineered for global research collaboration and secure knowledge management.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white uppercase tracking-wider">Access Portals</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-2 font-medium text-indigo-400">Platform Dashboard <ArrowRight size={14} /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link to="/support" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/documentation" className="hover:text-white transition-colors">Platform Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white uppercase tracking-wider">Security</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-5">
            <p className="text-text-muted text-sm">© 2026 ScholarAI System. All rights reserved.</p>
            <div className="flex gap-7 text-text-muted text-sm">
               <span className="flex items-center gap-1.5"><Lock size={12} className="text-blue-500" /> Secure SSL</span>
               <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-green-500" /> Open Access</span>
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
}
