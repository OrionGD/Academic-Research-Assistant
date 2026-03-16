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
  ChevronRight
} from 'lucide-react';
import Logo from '../components/Logo';
import { motion } from 'motion/react';
import HeroSection from '../components/HeroSection';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-dark font-sans selection:bg-accent-primary/20 selection:text-accent-highlight">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/40 backdrop-blur-md border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo
              size="md"
              imgClassName="group-hover:scale-105 transition-transform"
              textClassName="text-2xl"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary/70 hover:text-accent-highlight font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-text-secondary/70 hover:text-accent-highlight font-medium transition-colors">How it Works</a>
            <a href="#security" className="text-text-secondary/70 hover:text-accent-highlight font-medium transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-text-secondary/70 hover:text-text-primary font-semibold px-4 py-2">Login</Link>
            <Link 
              to="/signup" 
              className="bg-accent-primary text-bg-dark px-6 py-2.5 rounded-xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <HeroSection />

      {/* 2. TRUST / CREDIBILITY BAR */}
      <section className="py-12 border-y border-surface-light bg-bg-medium/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left">
              <p className="text-text-secondary/60 font-semibold text-sm uppercase tracking-wider mb-2">Trusted by researchers worldwide</p>
              <p className="text-text-primary font-bold text-lg">Graduate students, engineers, and innovation teams.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-3">
                <Database className="text-text-primary" size={24} />
                <span className="font-bold text-xl tracking-tight text-text-primary">MongoDB Atlas</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="text-text-primary fill-text-primary" size={24} />
                <span className="font-bold text-xl tracking-tight text-text-primary">Firebase</span>
              </div>
              <div className="flex items-center gap-3">
                <Cpu className="text-text-primary" size={24} />
                <span className="font-bold text-xl tracking-tight text-text-primary">Google Gemini</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="py-32 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInUp}>
              <span className="text-accent-primary font-bold uppercase tracking-widest text-sm mb-4 block">The Challenge</span>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-8 tracking-tight">The Research Bottleneck</h2>
              <p className="text-xl text-text-secondary mb-10 leading-relaxed">
                Modern research moves faster than ever, but researchers still struggle with outdated workflows. These tasks consume valuable research time.
              </p>
              <div className="space-y-5 mb-10">
                {[
                  'Reading hundreds of PDFs',
                  'Finding relevant papers manually',
                  'Comparing methodologies across studies',
                  'Extracting key insights efficiently'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-text-secondary/80 font-medium">
                    <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                      <span className="text-lg font-bold">×</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-lg font-bold text-text-primary flex items-center gap-3">
                <CheckCircle2 className="text-accent-highlight" />
                Our platform replaces manual research workflows with AI-driven analysis and discovery.
              </p>
            </motion.div>
            <div className="relative">
              <div className="bg-bg-medium rounded-[2rem] p-8 shadow-2xl relative z-10 overflow-hidden border border-surface-light">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary to-accent-highlight"></div>
                <div className="space-y-6">
                  <div className="h-4 w-3/4 bg-surface-dark rounded-full animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-surface-dark rounded-full animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-24 bg-surface-dark/50 rounded-2xl border border-surface-light flex items-center justify-center">
                      <FileText className="text-text-secondary/40" size={32} />
                    </div>
                    <div className="h-24 bg-surface-dark/50 rounded-2xl border border-surface-light flex items-center justify-center">
                      <Search className="text-text-secondary/40" size={32} />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-surface-dark rounded-full animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-surface-dark rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-primary/10 blur-[80px] -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT INTRODUCTION */}
      <section className="py-32 bg-bg-medium text-text-primary overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div {...fadeInUp}>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Your Personal AI Research Assistant</h2>
              <p className="text-xl text-text-secondary/70 max-w-3xl mx-auto leading-relaxed">
                This platform transforms research papers into structured knowledge that you can explore instantly. The result is a searchable, intelligent research library.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Extract Structure', desc: 'Extracts the full document structure automatically.', icon: Layers },
              { title: 'Detailed Analysis', desc: 'Generates detailed analysis of methodologies and findings.', icon: Zap },
              { title: 'Semantic Indexing', desc: 'Indexes content for deep semantic search across your library.', icon: Search },
              { title: 'AI Conversations', desc: 'Enables real-time AI conversations with any research paper.', icon: MessageSquare },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-dark/50 border border-surface-light p-8 rounded-3xl hover:bg-surface-medium transition-colors group"
              >
                <div className="w-12 h-12 bg-accent-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-accent-primary/20 text-bg-dark group-hover:scale-110 transition-transform">
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-text-primary">{item.title}</h3>
                <p className="text-text-secondary/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURES */}
      <section id="features" className="py-32 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 tracking-tight">Core Features</h2>
            <div className="w-20 h-1.5 bg-accent-primary mx-auto rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>

          <div className="space-y-32">
            {/* AI Document Analysis */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div {...fadeInUp}>
                <div className="w-16 h-16 bg-surface-dark rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-surface-light">
                  <FileText size={32} />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-6">AI Document Analysis</h3>
                <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                  Upload any research paper and instantly receive a structured breakdown including:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Summary of the research',
                    'Key insights & contributions',
                    'Methodology explanation',
                    'Results interpretation',
                    'Identified limitations',
                    'Future research directions'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-secondary/80 font-medium">
                      <CheckCircle2 className="text-accent-primary" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <div className="bg-bg-medium rounded-[2.5rem] p-10 border border-surface-light shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-accent-primary/5 blur-3xl"></div>
                <div className="bg-surface-dark rounded-2xl p-6 shadow-xl border border-surface-light relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center text-bg-dark">
                      <Zap size={20} />
                    </div>
                    <div className="font-bold text-text-primary">Research Insight Report</div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-full bg-surface-light rounded-full"></div>
                    <div className="h-3 w-5/6 bg-surface-light rounded-full"></div>
                    <div className="h-3 w-4/6 bg-surface-light rounded-full"></div>
                    <div className="pt-4 border-t border-surface-light">
                      <div className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-3">Key Methodology</div>
                      <div className="h-20 bg-accent-primary/5 rounded-xl border border-accent-primary/10"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Semantic Research Search */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 bg-bg-medium rounded-[2.5rem] p-10 relative overflow-hidden border border-surface-light">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent)] pointer-events-none"></div>
                <div className="bg-surface-dark rounded-2xl p-6 border border-surface-light shadow-2xl">
                  <div className="flex items-center gap-3 bg-surface-medium/50 px-4 py-3 rounded-xl mb-6 border border-surface-light">
                    <Search size={18} className="text-text-secondary/60" />
                    <div className="text-text-secondary/80 text-sm">Which papers discuss transformer architectures...</div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
                      <div className="text-xs font-bold text-accent-highlight mb-2 uppercase">Top Match (98% Relevance)</div>
                      <div className="text-sm text-text-primary">"Attention is All You Need" (Vaswani et al., 2017)</div>
                    </div>
                    <div className="p-4 bg-surface-medium/30 border border-surface-light rounded-xl">
                      <div className="text-sm text-text-secondary/60">"An Image is Worth 16x16 Words" (Dosovitskiy et al., 2020)</div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div {...fadeInUp} className="order-1 lg:order-2">
                <div className="w-16 h-16 bg-surface-dark rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-surface-light">
                  <Search size={32} />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-6">Semantic Research Search</h3>
                <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                  Traditional keyword search fails with academic papers. Our platform uses vector search to understand meaning and context, allowing you to find insights across your entire document collection.
                </p>
                <div className="bg-bg-medium p-6 rounded-2xl border border-surface-light italic text-text-primary/90 font-medium">
                  "Which papers discuss transformer architectures for medical imaging?"
                </div>
                <p className="mt-6 text-text-secondary/60 font-medium">The system instantly finds the most relevant sections across your library.</p>
              </motion.div>
            </div>

            {/* AI Research Chat */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div {...fadeInUp}>
                <div className="w-16 h-16 bg-surface-dark rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-surface-light">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-6">AI Research Chat</h3>
                <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                  Ask complex research questions and receive contextual answers sourced directly from your uploaded papers. The AI assistant retrieves relevant passages and constructs a grounded response with citations.
                </p>
                <p className="text-lg font-bold text-text-primary">This enables a completely new way to explore academic knowledge.</p>
              </motion.div>
              <div className="bg-bg-medium rounded-[2.5rem] p-8 border border-surface-light shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-accent-primary/5 blur-3xl"></div>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-end">
                    <div className="bg-accent-primary text-bg-dark px-5 py-3 rounded-2xl rounded-tr-none text-sm font-bold max-w-[80%] shadow-lg shadow-accent-primary/20">
                      How does this study handle class imbalance in the dataset?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-surface-dark text-text-secondary px-5 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed max-w-[90%] border border-surface-light">
                      The authors used a combination of SMOTE oversampling and a weighted loss function [Page 14, Section 3.2]. This allowed the model to...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Paper Comparison */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-square">
                  <div className="absolute top-0 left-0 w-48 h-64 bg-surface-dark border border-surface-light rounded-2xl shadow-xl rotate-[-12deg] flex items-center justify-center">
                    <FileText size={40} className="text-text-secondary/20" />
                  </div>
                  <div className="absolute top-10 left-20 w-48 h-64 bg-surface-medium border border-surface-light rounded-2xl shadow-xl rotate-[5deg] flex items-center justify-center z-10">
                    <FileText size={40} className="text-accent-primary/20" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-56 h-32 bg-bg-dark rounded-2xl shadow-2xl z-20 p-6 flex flex-col justify-center border border-surface-light">
                    <div className="text-accent-highlight text-xs font-bold uppercase mb-2">Comparison Result</div>
                    <div className="h-2 w-full bg-surface-light rounded-full mb-2"></div>
                    <div className="h-2 w-2/3 bg-surface-light rounded-full"></div>
                  </div>
                </div>
              </div>
              <motion.div {...fadeInUp} className="order-1 lg:order-2">
                <div className="w-16 h-16 bg-surface-dark rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-surface-light">
                  <Layers size={32} />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-6">Cross-Paper Comparison</h3>
                <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                  Compare multiple research papers to uncover common methodologies, conflicting findings, research gaps, and novel opportunities for further work.
                </p>
                <p className="text-lg font-bold text-text-primary">This dramatically accelerates literature review and research synthesis.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-32 bg-bg-medium">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-text-primary mb-4 tracking-tight">How It Works</h2>
            <p className="text-text-secondary">Three simple steps to research intelligence.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-0.5 bg-surface-light -z-10"></div>
            {[
              { step: 'Step 1', title: 'Upload your research papers', desc: 'The platform securely stores your documents and begins processing them using AI pipelines.' },
              { step: 'Step 2', title: 'AI analyzes the content', desc: 'The system extracts text, identifies structure, and generates embeddings for semantic search.' },
              { step: 'Step 3', title: 'Explore insights instantly', desc: 'Search across your library, chat with your documents, or generate detailed research analyses.' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-surface-dark border-4 border-bg-medium rounded-full flex items-center justify-center text-accent-primary font-bold text-xl shadow-lg mx-auto mb-8 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <h3 className="text-sm font-bold text-accent-primary uppercase tracking-widest mb-4">{item.step}</h3>
                <h4 className="text-xl font-bold text-text-primary mb-4">{item.title}</h4>
                <p className="text-text-secondary/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ENTERPRISE CAPABILITIES */}
      <section className="py-32 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-surface-dark rounded-[3rem] p-12 md:p-20 text-text-primary relative overflow-hidden border border-surface-light shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent-primary/10 to-transparent pointer-events-none"></div>
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Enterprise Capabilities</h2>
                <p className="text-xl text-text-secondary mb-12 leading-relaxed">
                  Built with enterprise-grade architecture. The platform can scale from individual researchers to large academic teams.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: 'Scalable AI', desc: 'Scalable AI processing pipelines.', icon: Cpu },
                    { title: 'Secure Storage', desc: 'Secure document storage.', icon: Shield },
                    { title: 'Vector Indexing', desc: 'Vector search indexing.', icon: Database },
                    { title: 'Real-time Streaming', desc: 'Real-time AI streaming responses.', icon: Zap },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-accent-primary shrink-0">
                        <item.icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-text-primary">{item.title}</h4>
                        <p className="text-sm text-text-secondary/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-40 bg-surface-medium rounded-3xl border border-surface-light flex items-center justify-center">
                    <Server className="text-text-secondary/20" size={40} />
                  </div>
                  <div className="h-64 bg-accent-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-accent-primary/20">
                    <Zap className="text-bg-dark fill-bg-dark" size={48} />
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-64 bg-surface-medium rounded-3xl border border-surface-light flex items-center justify-center">
                    <Database className="text-text-secondary/20" size={40} />
                  </div>
                  <div className="h-40 bg-surface-medium rounded-3xl border border-surface-light flex items-center justify-center">
                    <Lock className="text-text-secondary/20" size={40} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECURITY & PRIVACY */}
      <section id="security" className="py-32 bg-bg-medium">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp}>
            <div className="w-20 h-20 bg-accent-primary/10 rounded-3xl flex items-center justify-center text-accent-primary mx-auto mb-8 border border-accent-primary/20">
              <Shield size={40} />
            </div>
            <h2 className="text-4xl font-bold text-text-primary mb-6 tracking-tight">Security & Privacy</h2>
            <p className="text-xl text-text-secondary mb-16 max-w-2xl mx-auto">
              Your research data remains secure and private. All documents are stored in encrypted cloud storage with strict access controls.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-surface-dark p-10 rounded-[2rem] border border-surface-light shadow-lg flex flex-col items-center group hover:border-accent-primary/30 transition-all">
                <div className="w-14 h-14 bg-surface-medium rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="text-text-primary" size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-4">Firebase Authentication</h3>
                <p className="text-text-secondary/60 font-medium">Authentication powered by enterprise-grade security protocols.</p>
              </div>
              <div className="bg-surface-dark p-10 rounded-[2rem] border border-surface-light shadow-lg flex flex-col items-center group hover:border-accent-primary/30 transition-all">
                <div className="w-14 h-14 bg-surface-medium rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="text-text-primary" size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-4">Google Gemini</h3>
                <p className="text-text-secondary/60 font-medium">AI inference using state-of-the-art, privacy-focused models.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 9. TARGET USERS */}
      <section className="py-32 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-text-primary mb-4 tracking-tight">Designed for Knowledge-Intensive Environments</h2>
            <p className="text-text-secondary">Anyone working with complex research material can benefit from AI-assisted analysis.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              'Researchers',
              'Graduate students',
              'Academic institutions',
              'AI/ML engineers',
              'Innovation teams'
            ].map((user, i) => (
              <div key={i} className="px-8 py-4 bg-surface-dark border border-surface-light rounded-2xl text-text-primary font-bold text-lg hover:bg-surface-medium hover:border-accent-primary/30 transition-all cursor-default flex items-center gap-3 shadow-lg">
                <Users size={20} className="text-accent-primary" />
                {user}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION */}
      <section className="py-32 bg-accent-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.1),transparent)] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-6xl font-bold text-bg-dark mb-8 tracking-tight">Transform the Way You Conduct Research</h2>
            <p className="text-xl text-bg-dark/70 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Turn static research papers into an intelligent knowledge system. Start analyzing your research library with AI today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto bg-bg-dark text-accent-primary px-10 py-4.5 rounded-2xl font-bold text-lg hover:bg-bg-dark/90 transition-all shadow-2xl flex items-center justify-center gap-2 border border-accent-primary/20"
              >
                Upload Your First Paper <ArrowRight size={20} />
              </Link>
              <Link 
                to="/dashboard"
                className="w-full sm:w-auto bg-bg-dark/10 text-bg-dark border-2 border-bg-dark/20 px-10 py-4.5 rounded-2xl font-bold text-lg hover:bg-bg-dark/20 transition-all flex items-center justify-center gap-2"
              >
                Explore the Platform
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-24 bg-bg-dark text-text-primary border-t border-surface-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="lg:col-span-1">
              <div className="mb-6">
                <Logo size="md" textClassName="text-2xl" />
              </div>
              <p className="text-text-secondary/60 leading-relaxed">
                AI Academic Research Assistant. Transforming research papers into structured knowledge.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Platform Capabilities</h4>
              <ul className="space-y-4 text-text-secondary/60">
                <li><Link to="/documentation#analysis" className="hover:text-accent-primary transition-colors">AI document analysis</Link></li>
                <li><Link to="/documentation#search" className="hover:text-accent-primary transition-colors">Semantic search</Link></li>
                <li><Link to="/documentation#chat" className="hover:text-accent-primary transition-colors">Research chat assistant</Link></li>
                <li><Link to="/documentation#comparison" className="hover:text-accent-primary transition-colors">Document comparison</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Resources</h4>
              <ul className="space-y-4 text-text-secondary/60">
                <li><Link to="/documentation" className="hover:text-accent-primary transition-colors">Documentation</Link></li>
                <li><Link to="/api-reference" className="hover:text-accent-primary transition-colors">API Reference</Link></li>
                <li><Link to="/support" className="hover:text-accent-primary transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Stay Updated</h4>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-surface-dark border border-surface-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-primary w-full text-text-primary"
                />
                <button className="bg-accent-primary p-2 rounded-xl hover:bg-accent-highlight transition-colors text-bg-dark">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-surface-light flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-text-secondary/40 text-sm">© 2026 ScholarAI. All rights reserved.</p>
            <div className="flex gap-8 text-text-secondary/40 text-sm">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
