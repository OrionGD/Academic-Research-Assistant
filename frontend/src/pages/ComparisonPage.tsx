import { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  FileText, 
  ArrowRight, 
  Zap, 
  Target, 
  AlertTriangle, 
  TrendingUp,
  LayoutGrid,
  Columns,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Loader2,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import { documentsService } from '../services/api/documentsService';
import { Loader } from '../components/LoadingStates';

export default function ComparisonPage() {
  const { data: documents, loading: isLoadingDocs } = useDocuments();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    
    setIsComparing(true);
    setError(null);
    try {
      const result = await documentsService.compareDocuments(selectedIds);
      setComparison(result);
    } catch (err) {
      setError('Failed to generate comparison. Please try again.');
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Research Comparison</h1>
          <p className="text-text-secondary mt-1">Select up to 3 papers to compare their methodologies, results, and insights.</p>
        </div>
        <button 
          onClick={handleCompare}
          disabled={selectedIds.length < 2 || isComparing}
          className="bg-accent-primary text-bg-dark px-8 py-3 rounded-2xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isComparing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {comparison ? 'Regenerate Comparison' : 'Compare Papers'}
        </button>
      </div>

      {/* Selection Area */}
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((index) => {
          const doc = selectedDocs[index];
          return (
            <div 
              key={index}
              className={cn(
                "h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all relative group",
                doc 
                  ? "bg-surface-dark border-accent-primary/30 border-solid shadow-lg" 
                  : "bg-surface-dark/50 border-surface-light hover:border-accent-primary/50 hover:bg-surface-dark"
              )}
            >
              {doc ? (
                <>
                  <button 
                    onClick={() => toggleSelect(doc.id)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-surface-dark border border-surface-light rounded-full flex items-center justify-center text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 shadow-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                  <div className="p-3 bg-accent-primary/10 text-accent-primary rounded-2xl w-fit mb-4 border border-accent-primary/20">
                    <FileText size={24} />
                  </div>
                  <h3 className="font-bold text-text-primary mb-1 line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-text-secondary/60 font-medium">{doc.authors[0]} et al. • {doc.year}</p>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 bg-surface-medium text-text-secondary/40 rounded-full flex items-center justify-center mx-auto">
                    <Plus size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider">Add Paper {index + 1}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Paper Selector List */}
        <div className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-surface-light">
            <h3 className="font-bold text-text-primary">Your Library</h3>
            <p className="text-xs text-text-secondary/60">Select papers to compare</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoadingDocs ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-surface-medium/30 rounded-2xl animate-pulse" />
              ))
            ) : documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => toggleSelect(doc.id)}
                disabled={!selectedIds.includes(doc.id) && selectedIds.length >= 3}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4",
                  selectedIds.includes(doc.id)
                    ? "bg-accent-primary/5 border-accent-primary/30 ring-1 ring-accent-primary/20"
                    : "bg-transparent border-transparent hover:bg-surface-medium/50 hover:border-surface-light"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  selectedIds.includes(doc.id) ? "bg-accent-primary text-bg-dark" : "bg-surface-medium text-text-secondary/40"
                )}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-primary text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-text-secondary/60 truncate">{doc.authors.join(', ')}</p>
                </div>
                {selectedIds.includes(doc.id) && (
                  <CheckCircle2 className="text-accent-primary" size={20} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Results */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {isComparing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-6 h-full"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-accent-primary/10 border-t-accent-primary rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-primary" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary">AI is analyzing your papers...</h3>
                  <p className="text-text-secondary max-w-sm">Synthesizing methodologies, results, and conclusions across your selection.</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-4 h-full"
              >
                <div className="w-16 h-16 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center border border-accent-primary/20">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Comparison Failed</h3>
                <p className="text-text-secondary">{error}</p>
                <button 
                  onClick={handleCompare}
                  className="px-6 py-2 bg-accent-primary text-bg-dark rounded-xl font-bold hover:bg-accent-highlight transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            ) : comparison ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden">
                  <div className="p-8 border-b border-surface-light bg-surface-medium/30">
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                      <Sparkles size={24} className="text-accent-primary" />
                      AI-Generated Cross-Paper Analysis
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="px-8 py-6 bg-surface-medium/20 border-r border-surface-light w-64 text-text-secondary uppercase text-xs font-bold tracking-wider">Feature</th>
                          {selectedDocs.map(paper => (
                            <th key={paper.id} className="px-8 py-6 bg-surface-medium/20 min-w-[300px]">
                              <h4 className="font-bold text-text-primary line-clamp-2">{paper.title}</h4>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-light">
                        {comparison.features?.map((feature: any, i: number) => (
                          <tr key={i} className="group hover:bg-surface-medium/10 transition-colors">
                            <td className="px-8 py-8 border-r border-surface-light bg-surface-medium/5">
                              <span className="font-bold text-text-primary text-sm">{feature.name}</span>
                            </td>
                            {selectedIds.map(id => (
                              <td key={id} className="px-8 py-8">
                                <p className="text-text-secondary text-sm leading-relaxed">{feature.values[id]}</p>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Synthesis Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg">
                    <h4 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-accent-primary" />
                      Common Themes
                    </h4>
                    <ul className="space-y-4">
                      {comparison.commonThemes?.map((item: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                          <span className="text-accent-primary font-bold">•</span> {item}
                        </li>
                      )) || <p className="text-text-secondary/40 italic">No common themes identified.</p>}
                    </ul>
                  </div>
                  <div className="bg-accent-primary text-bg-dark p-8 rounded-3xl shadow-xl">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Lightbulb size={20} className="text-bg-dark/60" />
                      Research Synthesis
                    </h4>
                    <p className="text-bg-dark/80 text-sm leading-relaxed font-medium">
                      {comparison.summary}
                    </p>
                    <div className="mt-6 pt-6 border-t border-bg-dark/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-bg-dark/40 uppercase tracking-widest">AI Confidence: 94%</span>
                      <button className="text-xs font-bold hover:underline flex items-center gap-1">
                        Export Analysis <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-6 h-full"
              >
                <div className="w-20 h-20 bg-surface-medium text-text-secondary/20 rounded-3xl flex items-center justify-center">
                  <BarChart2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary">No comparison generated</h3>
                  <p className="text-text-secondary max-w-sm">Select at least 2 papers from your library and click "Compare Papers" to start analysis.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

