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
    <div className="min-h-screen bg-bg-dark font-sans text-text-primary">
      {/* Header */}
      <header className="bg-surface-dark border-b border-surface-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-bg-dark shadow-lg shadow-accent-primary/20 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">ScholarAI</span>
          </Link>
          <Link to="/documentation" className="flex items-center gap-2 text-text-secondary hover:text-accent-primary font-medium transition-colors">
            <ArrowLeft size={20} />
            Back to Docs
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36">
              <h3 className="text-sm font-bold text-text-secondary/40 uppercase tracking-wider mb-6">API Reference</h3>
              <nav className="space-y-2">
                <a href="#authentication" className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all">Authentication</a>
                <a href="#endpoints" className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all">Endpoints</a>
                <a href="#rate-limiting" className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all">Rate Limiting</a>
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
              <h1 className="text-4xl font-bold text-text-primary mb-6 tracking-tight">API Reference</h1>
              <p className="text-xl text-text-secondary leading-relaxed">
                Integrate ScholarAI's intelligence into your own applications using our RESTful API.
              </p>
            </motion.div>

            {/* Authentication */}
            <section id="authentication" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <Lock size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Authentication</h2>
              </div>
              <div className="bg-surface-dark rounded-3xl p-8 md:p-12 border border-surface-light shadow-lg">
                <p className="text-text-secondary mb-6 leading-relaxed">
                  ScholarAI uses Firebase ID tokens for authentication. All requests must include a Bearer token in the Authorization header.
                </p>
                <div className="bg-bg-dark rounded-2xl p-6 font-mono text-sm text-accent-primary border border-surface-light overflow-x-auto">
                  <code>Authorization: Bearer &lt;YOUR_FIREBASE_ID_TOKEN&gt;</code>
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <Terminal size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Endpoints</h2>
              </div>
              
              <div className="space-y-8">
                {endpoints.map((endpoint, i) => (
                  <div key={i} className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden">
                    <div className="px-8 py-6 bg-surface-medium/30 border-b border-surface-light flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg font-bold text-xs uppercase border ${
                          endpoint.method === 'POST' 
                            ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' 
                            : 'bg-surface-medium text-text-secondary border-surface-light'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-text-primary font-bold">{endpoint.path}</code>
                      </div>
                      <h3 className="text-text-primary font-bold">{endpoint.title}</h3>
                    </div>
                    <div className="p-8">
                      <p className="text-text-secondary mb-8">{endpoint.description}</p>
                      <h4 className="text-sm font-bold text-text-secondary/40 uppercase tracking-wider mb-4">Parameters</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-surface-light">
                              <th className="pb-4 font-bold text-text-primary">Name</th>
                              <th className="pb-4 font-bold text-text-primary">Type</th>
                              <th className="pb-4 font-bold text-text-primary">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-light">
                            {endpoint.params.map((param, j) => (
                              <tr key={j}>
                                <td className="py-4 font-mono text-sm text-accent-primary">{param.name}</td>
                                <td className="py-4 text-sm text-text-secondary/60">{param.type}</td>
                                <td className="py-4 text-sm text-text-secondary">{param.desc}</td>
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
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <Zap size={28} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">Rate Limiting</h2>
              </div>
              <div className="bg-surface-dark rounded-3xl p-8 md:p-12 border border-surface-light shadow-lg">
                <p className="text-text-secondary leading-relaxed">
                  To ensure platform stability, we enforce rate limits on all API endpoints. Standard accounts are limited to 100 requests per minute. For higher limits, please contact our enterprise support team.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-dark border-t border-surface-light py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-text-secondary font-medium">© 2026 ScholarAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
