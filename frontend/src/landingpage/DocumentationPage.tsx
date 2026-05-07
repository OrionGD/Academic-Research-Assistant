import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  ChevronRight, 
  Search, 
  Terminal, 
  Book, 
  Cpu, 
  Database, 
  Server, 
  Shield, 
  Code,
  ArrowLeft,
  Layout,
  Layers,
  Zap,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import LandingNavbar from '../shared/components/LandingNavbar';
import MarkdownRenderer from '../shared/components/MarkdownRenderer';
import { 
  FuturisticCard, 
  NeonBadge, 
  HolographicPanel, 
  FuturisticHeading 
} from '../shared/components/FuturisticUI';
import { FuturisticBackground } from '../shared/components/FuturisticBackground';

const DOCS_CONTENT: Record<string, { title: string; content: string; icon: any }> = {
  'api-reference': {
    title: 'API Reference',
    icon: Server,
    content: `
# API Reference

The ScholarAI API allows you to interact with the neural research engine programmatically.

## Authentication
ScholarAI uses session-based authentication for security. No API keys are required for local deployments.

## Endpoints

### POST \`/api/documents/ingest\`
Upload and process a research paper.
\`\`\`bash
curl -X POST http://localhost:2022/api/documents/ingest \\
  -F "file=@paper.pdf"
\`\`\`

### POST \`/api/chat/query\`
Query your research library using natural language.
\`\`\`json
{
  "query": "How does the model handle sparse weights?",
  "collection": "default"
}
\`\`\`
    `
  },
  'user-guide': {
    title: 'Operator Manual',
    icon: Book,
    content: `
# Operator Manual

Welcome to the ScholarAI Command Terminal. This guide will help you master the research workflow.

## Getting Started
1. **Initialize Library**: Upload your research PDFs via the Dashboard.
2. **Neural Extraction**: Wait for the AI to process metadata and structure.
3. **Query Engine**: Use the search bar for semantic discovery.

## Best Practices
- **High-Quality PDFs**: Ensure text is selectable for best extraction results.
- **Specific Queries**: Use detailed questions for more accurate RAG responses.
    `
  },
  'system-architecture': {
    title: 'Neural Pipeline',
    icon: Database,
    content: `
# Neural Pipeline Architecture

ScholarAI is built on a high-performance RAG (Retrieval-Augmented Generation) pipeline.

## Component Stack
- **Ingestion**: \`pypdf\` + \`tesseract\` OCR fallback.
- **Embedding**: \`SentenceTransformers\` (all-MiniLM-L6-v2).
- **Vector Store**: \`ChromaDB\` for sub-second similarity search.
- **Inference**: \`Google Gemini 2.0\` & \`Llama 3.1\`.

## Data Flow
1. Document Upload → Chunking → Embedding → Vector Storage.
2. User Query → Embedding → Similarity Search → Context Retrieval → LLM Response.
    `
  }
};

const DocumentationPage: React.FC = () => {
  const { docId } = useParams();
  const { darkMode } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const activeDoc = docId ? DOCS_CONTENT[docId] : DOCS_CONTENT['api-reference'];

  return (
    <div className="landing-page-root min-h-screen bg-bg-primary transition-colors duration-700 font-sans selection:bg-accent/20" data-theme={darkMode ? 'dark' : 'light'}>
      <FuturisticBackground />
      <LandingNavbar />

      <main className="pt-24 lg:pt-32 relative z-10 flex min-h-screen">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-8 right-8 z-[100] w-14 h-14 bg-accent text-primary-foreground rounded-full shadow-2xl flex items-center justify-center"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* ── SIDEBAR ────────────────────────────────────────────── */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-32 h-[calc(100vh-8rem)] w-80 shrink-0 
          bg-bg-primary/80 backdrop-blur-xl border-r border-accent/10 p-8
          transition-transform duration-500 z-50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="mb-10">
            <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-[0.4em] mb-6">Archive_Portals</h3>
            <nav className="space-y-3">
              {Object.entries(DOCS_CONTENT).map(([id, doc]) => (
                <Link 
                  key={id}
                  to={`/documentation/${id}`}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-xl transition-all group
                    ${docId === id || (!docId && id === 'api-reference')
                      ? 'bg-accent/10 border border-accent/30 text-accent shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                      : 'hover:bg-accent/5 text-text-secondary border border-transparent'}
                  `}
                >
                  <doc.icon size={18} className={docId === id ? 'text-accent' : 'text-text-muted group-hover:text-accent'} />
                  <span className="font-bold text-xs uppercase tracking-widest">{doc.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-10 border-t border-accent/10">
            <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-[0.4em] mb-6">System_Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Neural_Node', status: 'Active', color: 'bg-emerald-500' },
                { label: 'Vector_Core', status: 'Stable', color: 'bg-blue-500' },
                { label: 'Auth_Protocol', status: 'Secure', color: 'bg-accent' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-text-secondary">
                  <span>{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} />
                    <span className="opacity-60">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CONTENT AREA ───────────────────────────────────────── */}
        <section className="flex-1 p-4 lg:p-16 max-w-5xl mx-auto overflow-hidden">
          <motion.div
            key={docId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-16">
              <Link to="/system" className="inline-flex items-center gap-3 text-text-muted hover:text-accent transition-all mb-8 font-mono text-[10px] font-bold uppercase tracking-[0.3em] group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> // RETURN_TO_SYSTEM_DECK
              </Link>
              
              <div className="flex items-center gap-4 lg:gap-6 mb-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-[0_0_30px_var(--color-accent-glow)]">
                   <activeDoc.icon size={24} className="lg:hidden" />
                   <activeDoc.icon size={32} className="hidden lg:block" />
                </div>
                <div>
                   <NeonBadge className="mb-2">Documentation</NeonBadge>
                   <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tighter leading-none">
                     {activeDoc.title}
                   </h1>
                </div>
              </div>
            </div>

            {/* Markdown Content */}
            <HolographicPanel title={`LOG_VIEWER::${docId?.toUpperCase() || 'CORE'}`} className="p-8 md:p-12">
              <div className="prose prose-invert max-w-none 
                prose-headings:text-text-primary prose-headings:tracking-tighter prose-headings:font-bold
                prose-p:text-text-secondary prose-p:leading-relaxed prose-p:text-lg
                prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-black/60 prose-pre:border prose-pre:border-accent/20 prose-pre:rounded-2xl prose-pre:shadow-2xl
                prose-strong:text-text-primary prose-li:text-text-secondary
              ">
                <MarkdownRenderer content={activeDoc.content} />
              </div>
            </HolographicPanel>

            {/* Next Steps */}
            <div className="mt-16 grid md:grid-cols-2 gap-8">
               <FuturisticCard className="p-8 flex items-center justify-between group cursor-pointer hover:border-accent/40">
                 <div>
                    <div className="text-[10px] font-mono font-bold text-accent mb-2 uppercase tracking-widest">Protocol_Uplink</div>
                    <div className="font-bold text-text-primary uppercase tracking-wider">GitHub Repository</div>
                 </div>
                 <Code size={24} className="text-text-muted group-hover:text-accent transition-colors" />
               </FuturisticCard>
               <FuturisticCard className="p-8 flex items-center justify-between group cursor-pointer hover:border-accent/40">
                 <div>
                    <div className="text-[10px] font-mono font-bold text-accent mb-2 uppercase tracking-widest">Support_Channel</div>
                    <div className="font-bold text-text-primary uppercase tracking-wider">Community Forum</div>
                 </div>
                 <Activity size={24} className="text-text-muted group-hover:text-accent transition-colors" />
               </FuturisticCard>
            </div>
          </motion.div>
        </section>
      </main>
      
      {/* Footer Space */}
      <div className="h-20" />
    </div>
  );
};

export default DocumentationPage;
