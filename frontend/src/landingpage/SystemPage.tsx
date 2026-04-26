import React from 'react';
import { motion } from 'motion/react';
import { Mail, Shield, Lock, FileText, ChevronRight, ArrowLeft, Monitor } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import LandingNavbar from '../shared/components/LandingNavbar';
import Logo from '../shared/components/Logo';

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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="landing-page-root min-h-screen bg-bg-primary" data-theme={darkMode ? 'dark' : 'light'}>
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link to="/" className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-hover transition-colors mb-12 font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <header className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              System & Legal <span className="text-accent-primary">Directory</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Comprehensive information about ScholarAI's operations, security protocols, and legal frameworks.
            </p>
          </header>

          <div className="space-y-20">
            {/* ── COMPANY & CONTACT ────────────────────────────────── */}
            <section id="company" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <Logo size="sm" showText={false} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-wider text-sm">Company & Operations</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle">
                  <h3 className="font-bold text-text-primary mb-3 text-lg">Mission & Vision</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    ScholarAI is dedicated to democratizing advanced research intelligence. Our mission is to provide high-performance, open-access tools that enable researchers to navigate academic knowledge with unprecedented speed and precision.
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    The system uses a smart PDF extraction fallback chain (pypdf → PyMuPDF → OCR for scanned documents), local HuggingFace embeddings (all-MiniLM-L6-v2, 384-dim) for semantic search, and a dual-AI analysis pipeline: Gemini 2.0 Flash (primary) with Groq Llama 3.1 fallback.
                  </p>
                </div>

                <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle">
                  <h3 className="font-bold text-text-primary mb-3 text-lg">Contact Support</h3>
                  <p className="text-text-secondary text-sm mb-6">Our technical team is available for platform integrations, custom deployment queries, and research partnership discussions.</p>
                  <div className="space-y-4">
                    <a 
                      href="mailto:godfrey.cs23@krct.ac.in" 
                      className="inline-flex items-center gap-3 bg-accent-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-accent-primary/20 btn-glow-glitter"
                    >
                      <Mail size={16} /> godfrey.cs23@krct.ac.in
                    </a>
                    <p className="text-[10px] text-text-muted italic">Typical response time: 24–48 hours</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── DOCUMENTATION ──────────────────────────────────── */}
            <section id="docs" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <FileText size={20} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-wider text-sm">Technical Documentation</h2>
              </div>
              
              <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="font-bold text-text-primary mb-4">Core Documentation</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'api-reference', title: 'API Reference', desc: 'Complete REST API documentation for document ingestion and chat.' },
                        { id: 'user-guide', title: 'User Guide', desc: 'Comprehensive instructions for researchers and academic teams.' },
                        { id: 'system-architecture', title: 'System Architecture', desc: 'Deep dive into our RAG pipeline and vector indexing.' },
                        { id: 'deployment-guide', title: 'Deployment Guide', desc: 'Instructions for local and enterprise cloud deployments.' },
                      ].map((item) => (
                        <Link 
                          key={item.id} 
                          to={`/documentation/${item.id}`}
                          className="block p-4 rounded-xl bg-bg-primary border border-border-subtle group hover:border-accent-primary/40 transition-colors cursor-pointer"
                        >
                          <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center justify-between">
                            {item.title} <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                          </h4>
                          <p className="text-[10px] text-text-secondary">{item.desc}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="font-bold text-text-primary mb-4">Integration Hub</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      ScholarAI provides a variety of integration points for existing academic workflows. Our API supports asynchronous document processing and real-time citation-backed queries.
                    </p>
                    <div className="p-5 bg-bg-primary border border-dashed border-border-subtle rounded-xl">
                      <p className="text-[10px] font-mono text-accent-primary mb-2">curl -X POST "/api/documents/upload"</p>
                      <p className="text-[10px] text-text-muted italic">Example upload request header structure for technical users.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECURITY & COMPLIANCE ───────────────────────────── */}
            <section id="security" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <Shield size={20} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-wider text-sm">Security & Privacy Engineering</h2>
              </div>
              
              <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <Lock className="text-accent-primary mb-4" size={24} />
                    <h3 className="font-bold text-text-primary mb-2 text-sm uppercase">Local Storage</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      All research documents and vector embeddings are stored locally in MongoDB and ChromaDB. Your data never leaves your infrastructure unless you explicitly configure remote AI providers.
                    </p>
                  </div>
                  <div>
                    <Shield className="text-accent-primary mb-4" size={24} />
                    <h3 className="font-bold text-text-primary mb-2 text-sm uppercase">Open Access</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      ScholarAI operates without authentication or user accounts. This sessionless design eliminates password breaches, token theft, and credential-based attack vectors entirely.
                    </p>
                  </div>
                  <div>
                    <Monitor className="text-accent-primary mb-4" size={24} />
                    <h3 className="font-bold text-text-primary mb-2 text-sm uppercase">Environment Config</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      All sensitive configuration (API keys, database URIs) is managed through environment variables via .env files. CORS middleware restricts API access to approved frontend origins.
                    </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-border-subtle">
                  <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-widest">Data Retention Policy</h3>
                  <div className="grid sm:grid-cols-2 gap-6 text-xs text-text-secondary leading-relaxed">
                    <p>
                      Documents are stored in MongoDB and can be deleted at any time through the dashboard. Vector embeddings in ChromaDB are purged alongside document deletion, ensuring complete data removal.
                    </p>
                    <p>
                      Since the system is sessionless, no user profiles or browsing histories are maintained. Redis is used for task queuing and caching. Document processing (extraction, chunking, embedding, analysis) runs synchronously during upload.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── LEGAL ──────────────────────────────────────────── */}
            <section id="legal" className="scroll-mt-32 pt-20">
              <div className="space-y-16">
                <div>
                  <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-accent-primary rounded-full"></div>
                    Privacy Policy
                  </h2>
                  <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle text-sm text-text-secondary leading-relaxed space-y-4">
                    <p><strong>Effective Date: April 25, 2026</strong></p>
                    <p>
                      ScholarAI ("we", "us", or "the Platform") respects the privacy of our users. This policy outlines how we handle information in our open-access research environment. Because ScholarAI is designed for anonymous use, we do not require user registration or personal identification for core functionalities.
                    </p>
                    <p>
                      <strong>Information Collection:</strong> We collect no personal information. Uploaded research documents are processed solely for semantic analysis and stored locally on your infrastructure.
                    </p>
                    <p>
                      <strong>Data Sharing:</strong> ScholarAI does not sell, rent, or trade research data. We interface with Google Gemini for document analysis and optionally for remote embeddings, and with Groq for RAG chat inference, under provider terms that prohibit use of query data for model training.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-accent-primary rounded-full"></div>
                    Terms of Service
                  </h2>
                  <div className="bg-bg-secondary p-8 rounded-2xl border border-border-subtle text-sm text-text-secondary leading-relaxed space-y-4">
                    <p>
                      By accessing the ScholarAI platform, you agree to comply with these terms. The Platform is provided for academic and research purposes.
                    </p>
                    <p>
                      <strong>Acceptable Use:</strong> Users must not attempt to reverse-engineer the platform, bypass security measures, or use the tool for malicious data harvesting. ScholarAI is intended for the analysis of legitimate research materials.
                    </p>
                    <p>
                      <strong>Intellectual Property:</strong> You retain all rights to the documents you upload. ScholarAI claims no ownership over your research papers, abstracts, or the derived insights generated through our AI models.
                    </p>
                    <p>
                      <strong>Liability:</strong> While we strive for 100% accuracy, AI-generated insights should be verified against original sources. ScholarAI is not liable for research errors or decisions based on AI-summarized content.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-6 bg-bg-elevated rounded-xl border border-border-subtle">
                    <h3 className="font-bold text-text-primary mb-2 text-xs uppercase tracking-widest">Infrastructure Statement</h3>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      ScholarAI is a self-hosted platform built on open-source technologies. It runs on FastAPI (Python) with MongoDB, ChromaDB, and Redis as its data layer, managed via environment configuration.
                    </p>
                  </div>
                  <div className="p-6 bg-bg-elevated rounded-xl border border-border-subtle">
                    <h3 className="font-bold text-text-primary mb-2 text-xs uppercase tracking-widest">Open Source Disclosure</h3>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      The core architecture of ScholarAI utilizes open-source technologies including FastAPI, React, and SentenceTransformers to ensure transparency in research computation.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border-subtle bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text-muted text-sm italic">© 2026 ScholarAI System. All rights reserved.</p>
          <div className="flex items-center gap-4">
             <Logo size="sm" showText={true} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SystemPage;
