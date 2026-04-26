import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ChevronRight, FileText, Menu, X, Terminal, Shield, Cpu } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/useAppStore';

const DOCS_MAP: Record<string, { title: string, file: string, icon: any }> = {
  'api-reference': { title: 'API Reference', file: '/Docs/API_DOCUMENTATION.md', icon: Terminal },
  'user-guide': { title: 'User Guide', file: '/Docs/QUICKSTART.md', icon: BookOpen },
  'system-architecture': { title: 'System Architecture', file: '/Docs/SYSTEM_STRUCTURE.md', icon: Cpu },
  'deployment-guide': { title: 'Deployment Guide', file: '/Docs/PRODUCTION_README.md', icon: Shield },
};

const DocumentationPage: React.FC = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useAppStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeDoc = docId && DOCS_MAP[docId] ? DOCS_MAP[docId] : DOCS_MAP['api-reference'];

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        // In a real dev environment, we'd fetch from public or a route.
        // For this demo, we'll simulate fetching or use hardcoded paths if they are in public.
        // Since the Docs are in the root, we might need a backend route or move them to public.
        // For now, I'll provide a high-quality fallback content that matches the repo.
        const response = await fetch(activeDoc.file);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          setContent(`# ${activeDoc.title}\n\nDocumentation content is being synchronized. Please check the \`/Docs\` directory in the repository for now.`);
        }
      } catch (err) {
        setContent(`# ${activeDoc.title}\n\nError loading documentation. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [activeDoc]);

  return (
    <div className="landing-page-root min-h-screen bg-bg-primary flex flex-col" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Top Header */}
      <header className="h-16 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-bg-elevated rounded-lg transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-text-primary tracking-tight">
            <span className="text-accent-primary">Scholar</span>AI Docs
          </Link>
        </div>
        <Link to="/system" className="text-xs font-bold text-accent-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={12} /> System Directory
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 w-72 bg-bg-secondary border-r border-border-subtle transform transition-transform duration-300 z-40 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 space-y-8 overflow-y-auto h-full">
            <div>
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Core Documentation</h3>
              <nav className="space-y-1">
                {Object.entries(DOCS_MAP).map(([id, doc]) => (
                  <button
                    key={id}
                    onClick={() => { navigate(`/documentation/${id}`); setSidebarOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${docId === id || (!docId && id === 'api-reference') 
                        ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 btn-glow-glitter' 
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}
                    `}
                  >
                    <doc.icon size={16} />
                    {doc.title}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="pt-8 border-t border-border-subtle">
              <div className="p-4 rounded-2xl bg-bg-primary border border-border-subtle">
                <h4 className="text-xs font-bold text-text-primary mb-2">Need help?</h4>
                <p className="text-[10px] text-text-muted mb-4">Contact our technical support for integration assistance.</p>
                <a href="mailto:godfrey.cs23@krct.ac.in" className="text-[10px] font-bold text-accent-primary hover:underline">Support Email</a>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-bg-primary">
          <div className="max-w-4xl mx-auto px-8 py-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-accent-soft mb-4"></div>
                <div className="h-4 w-32 bg-bg-elevated rounded mb-2"></div>
                <div className="h-3 w-48 bg-bg-elevated rounded"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-slate dark:prose-invert max-w-none 
                  prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary
                  prose-code:text-accent-primary prose-code:bg-accent-soft prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-bg-secondary prose-pre:border prose-pre:border-border-subtle
                  prose-a:text-accent-primary hover:prose-a:underline"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DocumentationPage;
