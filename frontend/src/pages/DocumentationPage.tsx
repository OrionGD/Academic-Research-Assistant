import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, FileText, Search, MessageSquare, Layers, BookOpen, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  {
    id: 'analysis',
    title: 'AI Document Analysis',
    icon: FileText,
    content: `
      Our AI Document Analysis engine transforms standard PDF research papers into structured, machine-readable knowledge. 
      When you upload a document, the system performs several key operations:
      
      - **Structural Extraction**: Identifies headings, sections, and hierarchical relationships within the paper.
      - **Methodology Identification**: Specifically isolates the research design, data collection methods, and analytical frameworks used.
      - **Insight Generation**: Synthesizes the core findings and contributions into concise, actionable summaries.
      - **Limitations & Future Work**: Automatically extracts the authors' own assessments of their work's constraints and potential next steps.
    `
  },
  {
    id: 'search',
    title: 'Semantic Search',
    icon: Search,
    content: `
      Unlike traditional keyword-based search, our Semantic Search uses vector embeddings to understand the underlying meaning of your queries.
      
      - **Contextual Understanding**: Search for concepts, not just words. For example, searching for "neural network efficiency" will find papers discussing pruning, quantization, and architectural optimizations.
      - **Cross-Library Discovery**: Search across your entire uploaded collection simultaneously.
      - **Relevance Scoring**: Results are ranked by semantic similarity, ensuring the most conceptually relevant papers appear first.
    `
  },
  {
    id: 'chat',
    title: 'Research Chat Assistant',
    icon: MessageSquare,
    content: `
      The Research Chat Assistant provides a conversational interface to your research library. It uses Retrieval-Augmented Generation (RAG) to ensure accuracy.
      
      - **Grounded Responses**: Every answer provided by the AI is sourced directly from your uploaded documents.
      - **Citation Support**: The assistant provides specific page references and section citations for its claims.
      - **Complex Reasoning**: Ask the assistant to synthesize information across multiple papers or explain difficult technical concepts in simpler terms.
    `
  },
  {
    id: 'comparison',
    title: 'Document Comparison',
    icon: Layers,
    content: `
      Accelerate your literature review process with our automated Document Comparison tool.
      
      - **Side-by-Side Analysis**: Compare methodologies, results, and conclusions across two or more papers.
      - **Gap Analysis**: Identify areas where research findings conflict or where significant gaps in the current literature exist.
      - **Synthesis Reports**: Generate summaries that highlight the evolution of a specific research topic across multiple studies.
    `
  }
];

export default function DocumentationPage() {
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
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-accent-primary font-medium transition-colors">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36">
              <h3 className="text-sm font-bold text-text-secondary/40 uppercase tracking-wider mb-6">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a 
                    key={section.id}
                    href={`#${section.id}`}
                    className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all"
                  >
                    {section.title}
                  </a>
                ))}
                <div className="pt-4 mt-4 border-t border-surface-light">
                  <Link to="/api-reference" className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all">
                    API Reference
                  </Link>
                  <Link to="/support" className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-medium hover:text-accent-primary font-medium transition-all">
                    Support
                  </Link>
                </div>
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
              <h1 className="text-4xl font-bold text-text-primary mb-6 tracking-tight">Platform Documentation</h1>
              <p className="text-xl text-text-secondary leading-relaxed">
                Welcome to the ScholarAI documentation. Learn how to leverage our advanced AI tools to accelerate your research workflow.
              </p>
            </motion.div>

            <div className="space-y-24">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                      <section.icon size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">{section.title}</h2>
                  </div>
                  <div className="bg-surface-dark rounded-3xl p-8 md:p-12 border border-surface-light shadow-lg">
                    <div className="prose prose-invert max-w-none">
                      {section.content.split('\n').map((line, i) => {
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={i} className="flex gap-3 mb-4 last:mb-0">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0"></div>
                              <p className="text-text-secondary leading-relaxed m-0">
                                <span className="font-bold text-text-primary">{line.trim().substring(2).split(':')[0]}:</span>
                                {line.trim().substring(2).split(':')[1]}
                              </p>
                            </div>
                          );
                        }
                        if (line.trim()) {
                          return <p key={i} className="text-text-secondary leading-relaxed mb-6 last:mb-0">{line.trim()}</p>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-32 bg-accent-primary rounded-[2.5rem] p-12 text-center text-bg-dark relative overflow-hidden shadow-2xl shadow-accent-primary/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.05),transparent)] pointer-events-none"></div>
              <h2 className="text-3xl font-bold mb-6 relative z-10 tracking-tight">Ready to start your research?</h2>
              <p className="text-bg-dark/70 mb-10 max-w-xl mx-auto relative z-10 font-medium">
                Join thousands of researchers who are already using ScholarAI to transform their academic workflows.
              </p>
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 bg-bg-dark text-accent-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-bg-dark/90 transition-all shadow-xl relative z-10 border border-accent-primary/20"
              >
                Get Started for Free <ArrowRight size={20} />
              </Link>
            </div>
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
