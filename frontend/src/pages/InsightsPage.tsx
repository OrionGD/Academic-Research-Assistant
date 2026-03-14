import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  ChevronLeft, 
  Download, 
  Share2, 
  MessageSquare, 
  BookOpen, 
  Target, 
  Lightbulb, 
  AlertTriangle, 
  FastForward,
  Quote,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useAnalysis } from '../hooks/useAnalysis';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, formatDate } from '../utils/helpers';
import { Loader } from '../components/LoadingStates';

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>();
  const { actions: docActions } = useDocuments();
  const { getDocument } = docActions;
  const { data: analysisData, loading: analysisLoading, actions: analysisActions } = useAnalysis();
  const { getAnalysis } = analysisActions;
  
  const [paper, setPaper] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'methodology' | 'concepts' | 'quotes'>('summary');

  useEffect(() => {
    const fetchPaper = async () => {
      if (id) {
        try {
          setIsLoading(true);
          const data = await getDocument(id);
          setPaper(data);
          
          // If paper is completed but analysis not in paper object, fetch it
          if (data.status === 'completed' || data.status === 'processing') {
            getAnalysis(id);
          }
        } catch (err) {
          setError('Failed to load paper details.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchPaper();
  }, [id, getDocument, getAnalysis]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size={48} />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
        <AlertCircle size={48} className="mx-auto text-emerald-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">{error || 'Paper not found'}</h3>
        <p className="text-slate-500 mb-6">The document you're looking for doesn't exist or has been removed.</p>
        <Link to="/library" className="text-brand-600 font-bold hover:underline flex items-center justify-center gap-2">
          <ChevronLeft size={20} /> Back to Library
        </Link>
      </div>
    );
  }

  const analysis = analysisData || paper.analysis;
  const isProcessing = paper.status === 'processing' || (!analysis && analysisLoading);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/library" className="p-2 hover:bg-surface-medium rounded-xl text-text-secondary transition-all border border-transparent hover:border-surface-light">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isProcessing ? (
                <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 border border-accent-primary/20">
                  <Loader2 size={10} className="animate-spin" /> Analyzing...
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-wider rounded border border-accent-primary/20">AI Analyzed</span>
              )}
              <span className="text-xs text-text-secondary/40 font-medium">Uploaded on {formatDate(paper.uploadDate)}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary leading-tight tracking-tight">{paper.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-surface-dark border border-surface-light rounded-2xl text-text-secondary hover:bg-surface-medium transition-all shadow-lg">
            <Share2 size={20} />
          </button>
          <a 
            href={paper.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-surface-dark border border-surface-light rounded-2xl text-text-secondary hover:bg-surface-medium transition-all shadow-lg"
          >
            <Download size={20} />
          </a>
          <Link 
            to="/chat" 
            className="flex items-center gap-2 bg-accent-primary text-bg-dark px-6 py-3 rounded-2xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20"
          >
            <MessageSquare size={20} />
            Ask AI Assistant
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Abstract */}
        <div className="space-y-8">
          <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-accent-primary" />
              Paper Overview
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-2">Authors</p>
                <p className="text-sm text-text-secondary font-medium leading-relaxed">{paper.authors.join(', ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-2">Year</p>
                  <p className="text-sm text-text-secondary font-medium">{paper.year}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-2">Status</p>
                  <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded-md uppercase border border-accent-primary/20">{paper.status}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords?.map((k: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-surface-medium text-text-secondary text-xs font-medium rounded-lg border border-surface-light">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-2">Abstract</p>
                <p className="text-sm text-text-secondary/60 leading-relaxed italic">"{paper.abstract}"</p>
              </div>
            </div>
          </div>

          <div className="bg-accent-primary text-bg-dark p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Quote size={80} />
            </div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Research Tip</h3>
            <p className="text-bg-dark/70 text-sm leading-relaxed relative z-10 font-medium">
              Use the AI Assistant to cross-reference this paper with others in your library. 
              Try asking: "How does this methodology compare to the BERT paper?"
            </p>
            <Link to="/chat" className="mt-6 text-sm font-bold text-bg-dark flex items-center gap-2 hover:underline relative z-10">
              Try it now <FastForward size={16} />
            </Link>
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="bg-surface-dark p-2 rounded-2xl border border-surface-light shadow-lg flex gap-2">
            {[
              { id: 'summary', label: 'Summary', icon: FileText },
              { id: 'methodology', label: 'Methodology', icon: Target },
              { id: 'concepts', label: 'Key Concepts', icon: Lightbulb },
              { id: 'quotes', label: 'Important Quotes', icon: Quote },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-accent-primary text-bg-dark shadow-lg shadow-accent-primary/20" 
                    : "text-text-secondary hover:bg-surface-medium hover:text-text-primary"
                )}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg min-h-[500px]">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-16 h-16 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center mb-6 animate-bounce border border-accent-primary/20">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">AI Analysis in Progress</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  Our AI is currently reading and analyzing this paper. This usually takes 30-60 seconds depending on the length.
                </p>
                <div className="mt-8 flex gap-2">
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  {activeTab === 'summary' && (
                    <div className="space-y-8">
                      <section>
                        <h4 className="text-xl font-bold text-text-primary mb-4">Executive Summary</h4>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>{analysis.summary || 'No summary available.'}</ReactMarkdown>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-xl font-bold text-text-primary mb-4">Key Contributions</h4>
                        <ul className="space-y-4">
                          {analysis.keyContributions?.map((item: string, i: number) => (
                            <li key={i} className="flex gap-4">
                              <div className="mt-1.5 w-2 h-2 rounded-full bg-accent-primary shrink-0"></div>
                              <p className="text-text-secondary leading-relaxed">{item}</p>
                            </li>
                          )) || <p className="text-text-secondary/40 italic">No key contributions identified.</p>}
                        </ul>
                      </section>
                    </div>
                  )}

                  {activeTab === 'methodology' && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-text-primary mb-4">Methodology Breakdown</h4>
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{analysis.methodology || 'No methodology details available.'}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {activeTab === 'concepts' && (
                    <div className="grid gap-6">
                      <h4 className="text-xl font-bold text-text-primary mb-2">Key Concepts & Terminology</h4>
                      {analysis.keyConcepts?.map((concept: any, i: number) => (
                        <div key={i} className="p-6 bg-surface-medium/30 rounded-2xl border border-surface-light hover:border-accent-primary/30 transition-all group">
                          <h5 className="font-bold text-accent-primary mb-2 group-hover:text-accent-highlight transition-colors">{concept.term}</h5>
                          <p className="text-text-secondary text-sm leading-relaxed">{concept.definition}</p>
                        </div>
                      )) || <p className="text-text-secondary/40 italic">No key concepts identified.</p>}
                    </div>
                  )}

                  {activeTab === 'quotes' && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-text-primary mb-4">Important Quotes</h4>
                      {analysis.importantQuotes?.map((quote: any, i: number) => (
                        <div key={i} className="relative p-8 bg-surface-medium/30 rounded-3xl border-l-4 border-accent-primary shadow-lg">
                          <Quote className="absolute top-4 right-4 text-accent-primary/10" size={40} />
                          <p className="text-text-primary text-lg font-medium italic leading-relaxed mb-4">"{quote.text}"</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider">Page {quote.page}</span>
                            <button className="text-xs font-bold text-accent-primary hover:text-accent-highlight hover:underline flex items-center gap-1 transition-colors">
                              View in PDF <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      )) || <p className="text-text-secondary/40 italic">No important quotes identified.</p>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
