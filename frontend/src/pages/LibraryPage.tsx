import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  MoreVertical, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Download,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { formatDate, cn } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { TableRowSkeleton, Loader } from '../components/LoadingStates';

export default function LibraryPage() {
  const { data: documents, loading: isLoading, actions } = useDocuments();
  const { deleteDocument: removeDocument } = actions;
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredPapers = useMemo(() => {
    return documents.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [documents, searchQuery]);

  const totalPages = useMemo(() => Math.ceil(filteredPapers.length / itemsPerPage), [filteredPapers.length, itemsPerPage]);
  
  const paginatedPapers = useMemo(() => {
    return filteredPapers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPapers, currentPage, itemsPerPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      await removeDocument(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Research Library</h1>
          <p className="text-text-secondary mt-1">Manage and access your uploaded research papers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-medium border border-surface-light rounded-xl p-1 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent-primary text-bg-dark' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-primary text-bg-dark' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <Link to="/upload" className="bg-accent-primary text-bg-dark px-6 py-2.5 rounded-xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20">
            Upload New
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search by title, author, or keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-surface-light text-text-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all shadow-sm placeholder:text-text-secondary/50"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-surface-dark border border-surface-light rounded-2xl font-semibold text-text-primary hover:bg-surface-medium transition-all shadow-sm">
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Papers View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader size={40} />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-20 bg-surface-dark rounded-3xl border border-surface-light">
          <FileText size={48} className="mx-auto text-surface-light mb-4" />
          <h3 className="text-lg font-bold text-text-primary">No papers found</h3>
          <p className="text-text-secondary">Try adjusting your search or upload a new paper.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedPapers.map((paper) => (
            <div key={paper.id} className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden hover:border-accent-primary/50 transition-all group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-surface-medium text-accent-primary rounded-2xl relative">
                    <FileText size={24} />
                    {paper.status === 'processing' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-highlight rounded-full border-2 border-surface-dark flex items-center justify-center">
                        <Loader2 size={10} className="animate-spin text-bg-dark" />
                      </div>
                    )}
                  </div>
                  <div className="relative group/menu">
                    <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-medium rounded-lg transition-all">
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface-medium rounded-2xl shadow-xl border border-surface-light py-2 hidden group-hover/menu:block z-10">
                      <Link to={`/insights/${paper.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-light">
                        <Eye size={16} /> View Analysis
                      </Link>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-light">
                        <Download size={16} /> Download PDF
                      </a>
                      <div className="h-px bg-surface-light my-1"></div>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/10"
                      >
                        <Trash2 size={16} /> Delete Paper
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-text-primary mb-2 line-clamp-2 min-h-[3rem]">{paper.title}</h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-1">{paper.authors.join(', ')}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {paper.keywords?.slice(0, 2).map((k, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-medium text-accent-highlight text-[10px] font-bold uppercase tracking-wider rounded-md border border-surface-light">
                      {k}
                    </span>
                  ))}
                  {paper.keywords && paper.keywords.length > 2 && (
                    <span key="more" className="px-2 py-1 bg-surface-medium text-accent-highlight text-[10px] font-bold uppercase tracking-wider rounded-md border border-surface-light">
                      +{paper.keywords.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-light">
                  <span className="text-xs font-bold text-text-secondary/50">{paper.year}</span>
                  <Link 
                    to={`/insights/${paper.id}`}
                    className="text-sm font-bold text-accent-primary hover:text-accent-highlight flex items-center gap-1"
                  >
                    Analyze <TrendingUp size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-medium/50">
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Paper Title</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Authors</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Year</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Upload Date</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light">
              {paginatedPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-surface-medium/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-medium text-accent-primary rounded-lg relative">
                        <FileText size={18} />
                        {paper.status === 'processing' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-highlight rounded-full border border-surface-dark flex items-center justify-center">
                            <Loader2 size={8} className="animate-spin text-bg-dark" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{paper.title}</span>
                        {paper.status === 'processing' && (
                          <span className="text-[10px] font-bold text-accent-highlight uppercase tracking-wider">Processing...</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{paper.authors.join(', ')}</td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{paper.year}</td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{formatDate(paper.uploadDate)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <Link to={`/insights/${paper.id}`} className="p-2 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-all">
                        <Eye size={18} />
                      </Link>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-medium rounded-lg transition-all">
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-text-secondary">Showing <span className="font-bold text-text-primary">{paginatedPapers.length}</span> of <span className="font-bold text-text-primary">{filteredPapers.length}</span> papers</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-surface-light rounded-xl hover:bg-surface-medium text-text-primary transition-all disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl font-bold transition-all",
                  currentPage === page ? "bg-accent-primary text-bg-dark" : "hover:bg-surface-medium text-text-secondary"
                )}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-surface-light rounded-xl hover:bg-surface-medium text-text-primary transition-all disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
