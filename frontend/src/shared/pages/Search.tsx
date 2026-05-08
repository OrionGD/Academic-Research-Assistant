import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Database, Link, ArrowUpRight, Cpu, Zap, Loader2, Info, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { searchService } from '../services/api/searchService';
import { SearchResult } from '../../types/api';
import { toast } from 'sonner';
import { FuturisticBackground } from '../components/FuturisticBackground';

import { useAppStore } from '../../store/useAppStore';

export default function SearchPage() {
  const { activeCollectionName } = useAppStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    try {
      const data = await searchService.search(query, undefined, 1, 10, activeCollectionName || undefined);
      setResults(data);
      if (data.length === 0) {
        toast.info('No relevant segments found in the knowledge base.');
      }
    } catch (err) {
      toast.error('Retrieval failed. Ensure your knowledge base is synchronized.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto relative">
      <div className="opacity-10 pointer-events-none fixed inset-0 z-0">
        <FuturisticBackground />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 lg:py-16 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-[0.3em] font-mono shadow-[0_0_15px_var(--color-accent-glow)]">
             <Terminal size={14} />
             Vector_Retrieval_Engine_V1
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tighter uppercase tracking-widest">Semantic Search</h1>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
            Query your knowledge base using dense vector embeddings. Find high-similarity content across all synchronized sources with neural precision.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute inset-0 bg-accent/20 blur-[100px] opacity-0 group-focus-within:opacity-40 transition-opacity" />
          <form onSubmit={handleSearch} className="relative flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
            <div className="relative flex-1">
              <SearchIcon size={20} className="absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={window.innerWidth < 640 ? "Search..." : "Describe research concept..."} 
                className="w-full bg-background/80 border border-accent/20 rounded-[1.5rem] lg:rounded-[2.5rem] py-5 lg:py-7 pl-14 lg:pl-20 pr-6 lg:pr-10 text-base lg:text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-background transition-all shadow-2xl backdrop-blur-3xl font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={!query.trim() || isSearching}
              className="h-14 lg:h-[84px] px-8 lg:px-12 bg-accent hover:bg-accent-light text-primary-foreground rounded-[1.5rem] lg:rounded-[2.5rem] font-bold transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:grayscale"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Retrieve
            </button>
          </form>
        </div>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between max-w-3xl mx-auto border-b border-accent/10 pb-6 lg:pb-8 gap-4">
           <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-2 lg:gap-3 text-text-muted">
                 <Cpu size={14} className="lg:hidden text-accent" />
                 <Cpu size={16} className="hidden lg:block text-accent" />
                 <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Embedding: MiniLM_L6</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 text-text-muted">
                 <Activity size={14} className="lg:hidden text-accent" />
                 <Activity size={16} className="hidden lg:block text-accent" />
                 <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Top-K: 10_Nodes</span>
              </div>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/10 rounded-lg self-start sm:self-center">
             <span className="text-[8px] lg:text-[9px] font-bold text-accent uppercase tracking-[0.2em] font-mono">Method: Cosine_Similarity</span>
           </div>
        </div>

        {/* Results Area */}
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence>
            {isSearching ? (
               <div className="py-24 flex flex-col items-center justify-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-[0_0_20px_var(--color-accent-glow)]">
                    <Loader2 className="animate-spin text-accent" size={32} />
                  </div>
                  <p className="text-accent text-[10px] font-bold uppercase tracking-[0.4em] font-mono animate-pulse">Scanning_Vector_Space...</p>
               </div>
            ) : results.length > 0 ? (
              results.map((result, i) => (
                <motion.div 
                  key={result.documentId + i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/documents?highlight=${result.documentId}`)}
                  className="bb-premium-card p-6 lg:p-8 space-y-4 lg:space-y-6 hover:border-accent/40 cursor-pointer group bg-accent/[0.02] border-accent/10 rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_0_20px_rgba(0,242,255,0.05)] hover:shadow-[0_0_40px_var(--color-accent-glow)] transition-all duration-500"
                >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 lg:gap-3">
                        <div className={cn(
                          "w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full",
                          result.relevanceScore > 0.8 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                        )} />
                        <span className="text-[8px] lg:text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] font-mono">
                          MATCH: {(result.relevanceScore * 100).toFixed(1)}%
                        </span>
                     </div>
                      <div className="flex items-center gap-2 group/btn">
                        <span className="text-[8px] font-bold text-accent opacity-0 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest hidden sm:inline">Open in Library</span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-accent/5 flex items-center justify-center text-text-muted group-hover:text-accent group-hover:bg-accent/10 transition-all border border-transparent group-hover:border-accent/20">
                           <ArrowUpRight size={16} className="lg:hidden" />
                           <ArrowUpRight size={20} className="hidden lg:block" />
                        </div>
                      </div>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[9px] lg:text-[11px] font-bold text-accent uppercase tracking-[0.3em] font-mono">NODE_0{result.chunkIndex + 1}</h3>
                      <h4 className="text-xs lg:text-sm font-bold text-text-primary line-clamp-1 opacity-80">{result.title}</h4>
                    </div>
                    <p className="text-sm lg:text-base text-text-secondary leading-relaxed font-medium line-clamp-6">
                      {result.fullText}
                    </p>
                  </div>

                  <div className="pt-4 lg:pt-6 border-t border-accent/10 flex items-center justify-between">
                     <div className="flex items-center gap-2 lg:gap-3">
                        <Link size={14} className="lg:hidden text-accent/40" />
                        <Link size={16} className="hidden lg:block text-accent/40" />
                        <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] font-mono">Uplink: {result.documentId.slice(-8)}</span>
                     </div>
                     {result.pageNumber && (
                        <div className="flex items-center gap-2 px-2 lg:px-3 py-1 bg-accent/5 border border-accent/20 rounded-lg">
                           <span className="text-[8px] lg:text-[9px] font-bold text-accent uppercase tracking-[0.2em] font-mono">P.{result.pageNumber}</span>
                        </div>
                     )}
                  </div>
                </motion.div>
              ))
            ) : query && !isSearching && (
              <div className="py-24 text-center space-y-8">
                 <div className="w-20 h-20 rounded-[2rem] bg-accent/5 flex items-center justify-center mx-auto text-accent/20 border border-accent/10 shadow-inner">
                    <Info size={32} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary uppercase tracking-wider">Null Result</h3>
                    <p className="text-text-secondary text-sm font-medium">No neural matches found for the specified mission query.</p>
                 </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
