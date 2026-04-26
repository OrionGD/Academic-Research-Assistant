import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Database, Link, ArrowUpRight, Cpu, Zap, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { searchService } from '../services/api/searchService';
import { SearchResult } from '../../types/api';
import { toast } from 'sonner';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    try {
      const data = await searchService.search(query, 10);
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
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-10 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
             <Database size={12} />
             Vector Retrieval Engine
          </div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">Semantic Retrieval</h1>
          <p className="text-text-dim text-sm leading-relaxed">
            Query your knowledge base using dense vector embeddings. Find high-similarity content across all vectorized documents.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute inset-0 bg-accent/20 blur-3xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
          <form onSubmit={handleSearch} className="relative flex items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe the research concept you're looking for..." 
                className="w-full bg-white/[0.03] border border-white/[0.05] rounded-3xl py-6 pl-16 pr-6 text-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all shadow-2xl"
              />
            </div>
            <button 
              type="submit"
              disabled={!query.trim() || isSearching}
              className="h-[68px] px-10 bg-accent hover:bg-accent-light text-white rounded-3xl font-bold transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 disabled:grayscale"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Retrieve
            </button>
          </form>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between max-w-3xl mx-auto border-b border-white/[0.03] pb-6">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-text-dim">
                 <Cpu size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Embedding: MiniLM-L6 (384d)</span>
              </div>
              <div className="flex items-center gap-2 text-text-dim">
                 <Filter size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Top-K: 10 Segments</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Similarity Method: Cosine</p>
        </div>

        {/* Results Area */}
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {isSearching ? (
               <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-accent" size={32} />
                  <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Scanning Vector Space...</p>
               </div>
            ) : results.length > 0 ? (
              results.map((result, i) => (
                <motion.div 
                  key={result.documentId + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bb-premium-card p-6 space-y-4 hover:border-accent/30 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-lg",
                          result.relevanceScore > 0.8 ? "bg-emerald-500 shadow-emerald-500/40" : "bg-amber-500 shadow-amber-500/40"
                        )} />
                        <span className="text-[11px] font-bold text-text-primary uppercase tracking-widest">
                          Relevance: {(result.relevanceScore * 100).toFixed(1)}%
                        </span>
                     </div>
                     <ArrowUpRight size={16} className="text-text-dim group-hover:text-accent transition-all" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Segment {result.chunkIndex + 1}</h3>
                    <p className="text-sm text-text-dim leading-relaxed">
                      {result.fullText}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Link size={14} className="text-accent" />
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Doc ID: {result.documentId.slice(-8)}</span>
                     </div>
                     {result.pageNumber && (
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Page {result.pageNumber}</span>
                     )}
                  </div>
                </motion.div>
              ))
            ) : query && !isSearching && (
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-text-dim border border-white/5">
                    <Info size={24} />
                 </div>
                 <p className="text-text-dim text-sm font-medium">No matches found for your query in the synchronized documents.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
