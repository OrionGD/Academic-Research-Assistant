import { useState, useEffect } from 'react';
import { Search as SearchIcon, FileText, ArrowRight, Sparkles, Filter, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { Loader } from '../components/LoadingStates';

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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-primary/10 text-accent-primary rounded-full text-sm font-bold border border-accent-primary/20">
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
        <div className="absolute inset-0 bg-accent-primary/5 blur-3xl group-focus-within:bg-accent-primary/10 transition-all rounded-full"></div>
        <div className="relative flex items-center bg-surface-dark border-2 border-surface-light rounded-3xl p-2 focus-within:border-accent-primary transition-all shadow-2xl">
          <div className="pl-6 pr-4">
            <SearchIcon className="text-text-secondary" size={24} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How do Transformers handle long-range dependencies?"
            className="flex-1 py-4 bg-transparent text-lg font-medium text-text-primary focus:outline-none placeholder:text-text-secondary/30"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-accent-primary text-bg-dark px-8 py-4 rounded-2xl font-bold hover:bg-accent-highlight transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-accent-primary/20"
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
                  <button className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors">
                    <Filter size={16} /> Filter
                  </button>
                  <button className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors">
                    <TrendingUp size={16} /> Sort by Relevance
                  </button>
                </div>
              </div>

              {results.map((result) => (
                <div key={result.documentId} className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg hover:shadow-accent-primary/5 hover:border-accent-primary/30 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-primary/10 text-accent-primary rounded-xl border border-accent-primary/20">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">{result.title}</h4>
                        <p className="text-xs text-text-secondary font-medium">{result.authors.join(', ')} • {result.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-text-secondary/40 uppercase tracking-wider mb-1">Relevance</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-medium rounded-full overflow-hidden border border-surface-light">
                          <div className="h-full bg-accent-primary rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: `${result.relevanceScore * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-accent-primary">{Math.round(result.relevanceScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-medium/50 p-6 rounded-2xl border border-surface-light mb-6">
                    <p className="text-text-secondary leading-relaxed italic">"...{result.snippet}..."</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors">
                        <Clock size={16} /> View Context
                      </button>
                    </div>
                    <Link 
                      to={`/insights/${result.documentId}`}
                      className="text-sm font-bold text-accent-primary hover:text-accent-highlight flex items-center gap-1 transition-colors"
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
              <div className="w-20 h-20 bg-surface-medium text-text-secondary/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-surface-light">
                <SearchIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No results found</h3>
              <p className="text-text-secondary max-w-xs mx-auto">Try a different query or check your library for relevant papers.</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-surface-medium text-text-secondary/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-surface-light">
                <SearchIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Ready to search?</h3>
              <p className="text-text-secondary max-w-xs mx-auto">Enter a research question above to find insights across your library.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
