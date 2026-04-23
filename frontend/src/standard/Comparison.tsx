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
import { useDocuments } from '../shared/hooks/useDocuments';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import { documentsService } from '../shared/services/api/documentsService';
import { Loader } from '../shared/components/LoadingStates';

export default function ComparisonPage() {
  const { data: documents, loading: isLoadingDocs } = useDocuments();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter((i: any) => i !== id));
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
          className="btn-gold px-8 py-3 flex items-center gap-2 h-[52px]"
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
                  ? "bg-bg-secondary border-gold-main/30 border-solid shadow-lg shadow-gold-main/5" 
                  : "bg-black/20 border-silver-muted/20 hover:border-gold-main/50 hover:bg-bg-elevated/30"
              )}
            >
              {doc ? (
                <>
                  <button 
                    onClick={() => toggleSelect(doc.id)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-bg-secondary border border-silver-muted/20 rounded-full flex items-center justify-center text-text-muted hover:text-gold-main hover:border-gold-main/30 shadow-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                  <div className="p-3 bg-gold-main/10 text-gold-main rounded-2xl w-fit mb-4 border border-gold-main/20">
                    <FileText size={24} />
                  </div>
                  <h3 className="font-bold text-text-primary mb-1 line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-text-secondary/60 font-medium">{doc.authors[0]} et al. • {doc.year}</p>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 bg-bg-elevated text-text-muted/40 rounded-full flex items-center justify-center mx-auto border border-silver-muted/10">
                    <Plus size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-muted/40 uppercase tracking-widest leading-none">Add Paper {index + 1}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Paper Selector List */}
        <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden flex flex-col h-[600px] metallic-card">
          <div className="p-6 border-b border-silver-muted/10 bg-bg-elevated/30">
            <h3 className="font-bold text-text-primary">Your Library</h3>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Select papers to compare</p>
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
                    ? "bg-gold-main/5 border-gold-main/30 ring-1 ring-gold-main/20"
                    : "bg-transparent border-transparent hover:bg-bg-elevated/50 hover:border-silver-muted/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  selectedIds.includes(doc.id) 
                    ? "bg-gold-main text-[#0E0E10] border-gold-main/10 shadow-sm" 
                    : "bg-bg-elevated text-text-muted/40 border-silver-muted/10"
                )}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-primary text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-text-muted truncate uppercase tracking-widest text-[10px]">{doc.authors.join(', ')}</p>
                </div>
                {selectedIds.includes(doc.id) && (
                  <CheckCircle2 className="text-gold-main" size={20} />
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
                className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-6 h-full metallic-card"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gold-main/10 border-t-gold-main rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.1)]"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-main" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary text-glow-gold">AI is analyzing your papers...</h3>
                  <p className="text-text-muted max-w-sm">Synthesizing methodologies, results, and conclusions across your selection.</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-4 h-full"
              >
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Comparison Failed</h3>
                <p className="text-text-muted">{error}</p>
                <button 
                  onClick={handleCompare}
                  className="btn-gold px-8 py-2 h-[44px]"
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
                <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden metallic-card">
                  <div className="p-8 border-b border-silver-muted/10 bg-bg-elevated/30">
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 text-glow-gold">
                      <Sparkles size={24} className="text-gold-main" />
                      AI-Generated Cross-Paper Analysis
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="px-8 py-6 bg-bg-elevated/50 border-r border-silver-muted/10 w-64 text-text-muted uppercase text-[10px] font-bold tracking-widest">Key Methodology</th>
                          {selectedDocs.map((paper: any) => (
                            <th key={paper.id} className="px-8 py-6 bg-bg-elevated/50 border-b border-silver-muted/10 min-w-[300px]">
                              <h4 className="font-bold text-text-primary line-clamp-2">{paper.title}</h4>
                              <p className="text-[10px] font-bold text-gold-main uppercase tracking-widest mt-1 opacity-60">Comparative Study</p>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-silver-muted/5">
                        {comparison.features?.map((feature: any, i: number) => (
                          <tr key={i} className="group hover:bg-bg-elevated/10 transition-colors">
                            <td className="px-8 py-8 border-r border-silver-muted/10 bg-bg-elevated/5">
                              <span className="font-bold text-text-primary text-sm group-hover:text-gold-main transition-colors uppercase tracking-widest">{feature.name}</span>
                            </td>
                            {selectedIds.map(id => (
                              <td key={id} className="px-8 py-8">
                                <p className="text-text-muted text-sm leading-relaxed">{feature.values[id]}</p>
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
                  <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-lg metallic-card">
                    <h4 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-gold-main" />
                      Common Themes
                    </h4>
                    <ul className="space-y-4">
                      {comparison.commonThemes?.map((item: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-text-muted leading-relaxed">
                          <span className="text-gold-main font-bold text-glow-gold">•</span> {item}
                        </li>
                      )) || <p className="text-text-muted/40 italic text-sm">No common themes identified.</p>}
                    </ul>
                  </div>
                  <div className="bg-gold-main text-[#0E0E10] p-8 rounded-3xl shadow-2xl shadow-gold-main/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Zap size={120} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Lightbulb size={20} className="text-[#0E0E10]/60" />
                        Research Synthesis
                      </h4>
                      <p className="text-[#0E0E10]/90 text-sm leading-relaxed font-bold uppercase tracking-wide">
                        {comparison.summary}
                      </p>
                      <div className="mt-6 pt-6 border-t border-[#0E0E10]/10 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#0E0E10]/60 uppercase tracking-[0.2em]">AI Confidence Score: 98.4%</span>
                        <button className="text-xs font-bold hover:underline flex items-center gap-1 group/btn">
                          Export Results <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg p-12 flex flex-col items-center justify-center text-center space-y-6 h-full"
              >
                <div className="w-20 h-20 bg-bg-elevated text-text-muted/20 rounded-3xl flex items-center justify-center border border-silver-muted/10">
                  <BarChart2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary">No comparison generated</h3>
                  <p className="text-text-muted max-w-sm">Select at least 2 papers from your library and click "Compare Papers" to start analysis.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

