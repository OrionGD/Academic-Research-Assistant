import { useState, useEffect } from 'react';
import { Search as SearchIcon, FileText, ArrowRight, Sparkles, Filter, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useSearch } from '../../shared/hooks/useSearch';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { Loader } from '../../shared/components/LoadingStates';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results, loading: isLoading, error, actions } = useSearch();
  const { debouncedSearch } = actions;
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      debouncedSearch(query);
      setHasSearched(true);
    }
  }, [query, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      debouncedSearch(query);
      setHasSearched(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-main/10 text-gold-main rounded-full text-sm font-bold border border-gold-main/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <Sparkles size={16} />
          Semantic AI Search
        </div>
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">Search your research library</h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Ask questions in natural language. Our AI will find relevant papers and highlight the most important sections.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-gold-main/5 blur-[100px] group-focus-within:bg-gold-main/10 transition-all rounded-full"></div>
        <div className="relative flex items-center bg-bg-secondary border-2 border-silver-muted/20 rounded-3xl p-2 focus-within:border-gold-main transition-all shadow-2xl shadow-gold-main/5">
          <div className="pl-6 pr-4">
            <SearchIcon className="text-text-muted" size={24} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How do Transformers handle long-range dependencies?"
            className="flex-1 py-4 bg-transparent text-lg font-medium text-text-primary focus:outline-none placeholder:text-text-muted/30"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold px-8 py-4 flex items-center gap-2 disabled:opacity-70 h-[60px]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </div>
      </form>

      {/* Results Area */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center space-y-4"
            >
              <Loader size={40} />
              <p className="text-text-secondary font-medium animate-pulse">Analyzing your library for semantic matches...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">Search failed</h3>
              <p className="text-text-secondary">There was an error processing your search. Please try again.</p>
            </motion.div>
          ) : hasSearched && results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-text-primary">Found {results.length} relevant matches</h3>
                <div className="flex items-center gap-4">
                  <button className="text-sm font-bold text-text-muted hover:text-gold-main flex items-center gap-2 transition-colors">
                    <Filter size={16} /> Filter
                  </button>
                  <button className="text-sm font-bold text-text-muted hover:text-gold-main flex items-center gap-2 transition-colors">
                    <TrendingUp size={16} /> Sort by Relevance
                  </button>
                </div>
              </div>

              {results.map((result) => (
                <div key={result.documentId} className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-lg hover:shadow-gold-main/5 hover:border-gold-main/30 transition-all group metallic-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gold-main/10 text-gold-main rounded-xl border border-gold-main/20">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary group-hover:text-gold-main transition-colors">{result.title}</h4>
                        <p className="text-xs text-text-muted font-medium">{result.authors.join(', ')} • {result.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-text-muted/40 uppercase tracking-wider mb-1">Relevance</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-bg-elevated rounded-full overflow-hidden border border-silver-muted/10">
                          <div className="h-full bg-gold-main rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" style={{ width: `${result.relevanceScore * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gold-main">{Math.round(result.relevanceScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-bg-elevated/50 p-6 rounded-2xl border border-silver-muted/10 mb-6 group-hover:border-gold-main/20 transition-colors">
                    <p className="text-text-secondary leading-relaxed italic">"...{result.snippet}..."</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="text-sm font-bold text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors">
                        <Clock size={16} /> View Context
                      </button>
                    </div>
                    <Link 
                      to={`/insights/${result.documentId}`}
                      className="text-sm font-bold text-gold-main hover:text-gold-hover flex items-center gap-1 transition-colors"
                    >
                      Open Paper Analysis <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : hasSearched ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-bg-elevated text-text-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-silver-muted/20">
                <SearchIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No results found</h3>
              <p className="text-text-muted max-w-xs mx-auto">Try a different query or check your library for relevant papers.</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-bg-elevated text-text-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-silver-muted/20">
                <SearchIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2 text-glow-gold">Ready to search?</h3>
              <p className="text-text-muted max-w-xs mx-auto">Enter a research question above to find insights across your library.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
