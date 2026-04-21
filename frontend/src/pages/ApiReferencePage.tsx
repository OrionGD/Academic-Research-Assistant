import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Terminal, Code, Globe, Lock, Cpu, Database, Server, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const endpoints = [
  {
    method: 'POST',
    path: '/api/documents/upload',
    title: 'Upload Document',
    description: 'Upload a PDF research paper for analysis and indexing.',
    params: [
      { name: 'file', type: 'File', desc: 'The PDF file to upload (max 50MB).' },
      { name: 'metadata', type: 'Object', desc: 'Optional metadata about the document.' }
    ]
  },
  {
    method: 'GET',
    path: '/api/documents',
    title: 'List Documents',
    description: 'Retrieve a paginated list of all uploaded documents.',
    params: [
      { name: 'page', type: 'Number', desc: 'Page number (default: 1).' },
      { name: 'limit', type: 'Number', desc: 'Items per page (default: 20).' }
    ]
  },
  {
    method: 'POST',
    path: '/api/chat/stream',
    title: 'Chat Stream',
    description: 'Send a message to the AI assistant and receive a streamed response.',
    params: [
      { name: 'message', type: 'String', desc: 'The user message.' },
      { name: 'documentIds', type: 'Array', desc: 'Optional list of document IDs for context.' }
    ]
  },
  {
    method: 'GET',
    path: '/api/search',
    title: 'Semantic Search',
    description: 'Perform a semantic search across the research library.',
    params: [
      { name: 'query', type: 'String', desc: 'The search query.' },
      { name: 'filters', type: 'Object', desc: 'Optional search filters.' }
    ]
  }
];

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-bg-main font-sans text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary-80 backdrop-blur-md border-b border-silver-muted/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gold-main rounded-xl flex items-center justify-center text-[#0E0E10] shadow-lg shadow-gold-main/20 border border-gold-main/10 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">ScholarAI</span>
          </Link>
          <Link to="/documentation" className="flex items-center gap-2 text-text-muted hover:text-gold-main font-bold transition-all uppercase tracking-widest text-sm">
            <ArrowLeft size={16} />
            Back to Docs
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36">
              <h3 className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.2em] mb-6">API Reference</h3>
              <nav className="space-y-2">
                <a href="#authentication" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">Authentication</a>
                <a href="#endpoints" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">Endpoints</a>
                <a href="#rate-limiting" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">Rate Limiting</a>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <h1 className="text-4xl font-bold text-text-primary mb-6 tracking-tight text-glow-gold">API Reference</h1>
              <p className="text-lg text-text-muted leading-relaxed font-medium">
                Integrate ScholarAI's intelligence into your own applications using our RESTful API.
              </p>
            </motion.div>

            {/* Authentication */}
            <section id="authentication" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main border border-gold-main/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Lock size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Authentication</h2>
              </div>
              <div className="bg-bg-secondary rounded-3xl p-8 md:p-12 border border-silver-muted/20 shadow-lg metallic-card">
                <p className="text-text-muted mb-6 leading-relaxed font-medium">
                  ScholarAI uses Firebase ID tokens for authentication. All requests must include a Bearer token in the Authorization header.
                </p>
                <div className="bg-black/60 rounded-2xl p-6 font-mono text-sm text-gold-main border border-silver-muted/10 overflow-x-auto shadow-inner">
                  <code>Authorization: Bearer &lt;YOUR_FIREBASE_ID_TOKEN&gt;</code>
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main border border-gold-main/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Terminal size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Endpoints</h2>
              </div>
              
              <div className="space-y-8">
                {endpoints.map((endpoint, i) => (
                  <div key={i} className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden metallic-card">
                    <div className="px-8 py-6 bg-bg-elevated/30 border-b border-silver-muted/10 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase border tracking-widest ${
                          endpoint.method === 'POST' 
                            ? 'bg-gold-main/10 text-gold-main border-gold-main/20' 
                            : 'bg-bg-elevated text-text-muted border-silver-muted/20'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-text-primary font-bold text-glow-gold">{endpoint.path}</code>
                      </div>
                      <h3 className="text-text-primary font-bold">{endpoint.title}</h3>
                    </div>
                    <div className="p-8">
                      <p className="text-text-muted mb-8 font-medium">{endpoint.description}</p>
                      <h4 className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.2em] mb-4">Request Parameters</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-silver-muted/10">
                              <th className="pb-4 font-bold text-text-primary uppercase tracking-widest text-[10px]">Name</th>
                              <th className="pb-4 font-bold text-text-primary uppercase tracking-widest text-[10px]">Type</th>
                              <th className="pb-4 font-bold text-text-primary uppercase tracking-widest text-[10px]">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-silver-muted/5">
                            {endpoint.params.map((param, j) => (
                              <tr key={j} className="group hover:bg-bg-elevated/5 transition-colors">
                                <td className="py-4 font-mono text-sm text-gold-main font-bold">{param.name}</td>
                                <td className="py-4 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">{param.type}</td>
                                <td className="py-4 text-sm text-text-muted font-medium">{param.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Rate Limiting */}
            <section id="rate-limiting" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main border border-gold-main/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Zap size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Rate Limiting</h2>
              </div>
              <div className="bg-bg-secondary rounded-3xl p-8 md:p-12 border border-silver-muted/20 shadow-lg metallic-card">
                <p className="text-text-muted leading-relaxed font-medium">
                  To ensure platform stability, we enforce rate limits on all API endpoints. Standard accounts are limited to 100 requests per minute. For higher limits, please contact our enterprise support team.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-bg-secondary border-t border-silver-muted/10 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-text-muted font-bold uppercase tracking-[0.3em] text-[10px]">© 2026 ScholarAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
