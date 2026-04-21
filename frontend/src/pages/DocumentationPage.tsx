import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, FileText, Search, MessageSquare, Layers, BookOpen, Shield, Zap, ArrowRight, File, Scale, Cookie } from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  {
    id: 'analysis',
    title: 'AI Document Analysis',
    icon: FileText,
    content: `
      Our AI Document Analysis engine transforms standard PDF research papers into structured, machine-readable knowledge. 
      When you upload a document, the system performs several key operations:
      
      - Structural Extraction: Identifies headings, sections, and hierarchical relationships within the paper.
      - Methodology Identification: Specifically isolates the research design, data collection methods, and analytical frameworks used.
      - Insight Generation: Synthesizes the core findings and contributions into concise, actionable summaries.
      - Limitations & Future Work: Automatically extracts the authors' own assessments of their work's constraints and potential next steps.
    `
  },
  {
    id: 'search',
    title: 'Semantic Search',
    icon: Search,
    content: `
      Unlike traditional keyword-based search, our Semantic Search uses vector embeddings to understand the underlying meaning of your queries.
      
      - Contextual Understanding: Search for concepts, not just words. For example, searching for "neural network efficiency" will find papers discussing pruning, quantization, and architectural optimizations.
      - Cross-Library Discovery: Search across your entire uploaded collection simultaneously.
      - Relevance Scoring: Results are ranked by semantic similarity, ensuring the most conceptually relevant papers appear first.
    `
  },
  {
    id: 'chat',
    title: 'Research Chat Assistant',
    icon: MessageSquare,
    content: `
      The Research Chat Assistant provides a conversational interface to your research library. It uses Retrieval-Augmented Generation (RAG) to ensure accuracy.
      
      - Grounded Responses: Every answer provided by the AI is sourced directly from your uploaded documents.
      - Citation Support: The assistant provides specific page references and section citations for its claims.
      - Complex Reasoning: Ask the assistant to synthesize information across multiple papers or explain difficult technical concepts in simpler terms.
    `
  },
  {
    id: 'comparison',
    title: 'Document Comparison',
    icon: Layers,
    content: `
      Accelerate your literature review process with our automated Document Comparison tool.
      
      - Side-by-Side Analysis: Compare methodologies, results, and conclusions across two or more papers.
      - Gap Analysis: Identify areas where research findings conflict or where significant gaps in the current literature exist.
      - Synthesis Reports: Generate summaries that highlight the evolution of a specific research topic across multiple studies.
    `
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: Shield,
    content: `
      Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
      
      - Information We Collect: When you upload documents or use our services, we collect the content to provide AI analysis. This data is processed securely and not shared with third parties.
      - Data Usage: Your documents are used only for the AI analysis you request and are stored securely with encryption.
      - Data Retention: Uploaded documents are retained until you delete them or request deletion. We keep minimal metadata for service improvement.
      - Security: We use industry-standard encryption and security measures to protect your data.
      - Your Rights: You can access, delete, or export your data at any time through your account settings.
      
      Last updated: [Current Date]. Contact support@scholarai.com for questions.
    `
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: Scale,
    content: `
      By using ScholarAI, you agree to these Terms of Service.
      
      - Service Description: ScholarAI provides AI-powered analysis of academic documents. We process uploaded PDFs to generate summaries, insights, and comparisons.
      - User Responsibilities: You must only upload documents you have rights to use. Do not upload copyrighted material without permission.
      - Account Termination: We may suspend accounts for violation of terms or abuse of service.
      - No Warranty: Service provided "as is". We strive for accuracy but AI analysis may contain errors.
      - Limitation of Liability: We are not liable for any damages from use of the service.
      
      Last updated: [Current Date]. Full terms available upon request.
    `
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    icon: Cookie,
    content: `
      We use cookies to improve your experience.
      
      - Essential Cookies: Required for site functionality (login, sessions).
      - Analytics Cookies: Help us understand usage patterns (anonymized).
      - Your Controls: You can manage cookies through browser settings. Some features may not work without essential cookies.
      - Third Parties: We use secure third-party services that respect your privacy.
      
      Last updated: [Current Date].
    `
  }
];

export default function DocumentationPage() {
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
          <Link to="/" className="flex items-center gap-2 text-text-muted hover:text-gold-main font-bold transition-all uppercase tracking-widest text-xs">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36">
              <h3 className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.2em] mb-6">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a 
                    key={section.id}
                    href={`#${section.id}`}
                    className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10"
                  >
                    {section.title}
                  </a>
                ))}
                <div className="pt-6 mt-6 border-t border-silver-muted/10 space-y-2">
                  <Link to="/api-reference" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">
                    API Reference
                  </Link>
                  <Link to="/support" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">
                    Support
                  </Link>
                  <Link to="/documentation#privacy" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">
                    Privacy Policy
                  </Link>
                  <Link to="/documentation#terms" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">
                    Terms of Service
                  </Link>
                  <Link to="/documentation#cookies" className="block px-4 py-2.5 rounded-xl text-text-muted hover:bg-bg-elevated hover:text-gold-main font-bold text-sm transition-all border border-transparent hover:border-silver-muted/10">
                    Cookie Policy
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
              <h1 className="text-4xl font-bold text-text-primary mb-6 tracking-tight text-glow-red">Platform Documentation</h1>
              <p className="text-lg text-text-muted leading-relaxed font-medium">
                Welcome to the ScholarAI documentation. Learn how to leverage our advanced AI tools to accelerate your research workflow.
              </p>
            </motion.div>

            <div className="space-y-24">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main border border-gold-main/20 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                      <section.icon size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">{section.title}</h2>
                  </div>
                  <div className="bg-bg-secondary rounded-3xl p-8 md:p-12 border border-silver-muted/20 shadow-lg metallic-card">
                    <div className="prose prose-invert max-w-none">
                      {section.content.split('\n').map((line, i) => {
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={i} className="flex gap-4 mb-4 last:mb-0">
                              <div className="mt-2 w-2 h-2 rounded-full bg-gold-main shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.4)]"></div>
                              <p className="text-text-muted leading-relaxed m-0 font-medium">
                                <span className="font-bold text-text-primary">{line.trim().substring(2).split(':')[0]}:</span>
                                {line.trim().substring(2).split(':')[1]}
                              </p>
                            </div>
                          );
                        }
                        if (line.trim()) {
                          return <p key={i} className="text-text-muted leading-relaxed mb-6 last:mb-0 font-medium">{line.trim()}</p>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-32 bg-gold-main rounded-[2.5rem] p-12 text-center text-[#0E0E10] relative overflow-hidden shadow-2xl shadow-gold-main/20 group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Zap size={200} />
              </div>
              <h2 className="text-4xl font-bold mb-6 relative z-10 tracking-tight">Ready to start your research?</h2>
              <p className="text-[#0E0E10]/70 mb-10 max-w-xl mx-auto relative z-10 font-bold uppercase tracking-widest text-sm">
                Join thousands of researchers who are already using ScholarAI to transform their academic workflows.
              </p>
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 bg-[#0E0E10] text-gold-main px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all relative z-10 border border-gold-main/20"
              >
                Get Started for Free <ArrowRight size={20} />
              </Link>
            </div>
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
