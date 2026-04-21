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
import DocumentViewerModal from '../components/DocumentViewerModal';
import AnalysisPreviewModal from '../components/AnalysisPreviewModal';
import { documentsService } from '../services/api/documentsService';
import { toast } from 'sonner';

export default function LibraryPage() {
  const { data: documents, loading: isLoading, actions } = useDocuments();
  const { deleteDocument: removeDocument } = actions;
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
  const [analysisPreviewDoc, setAnalysisPreviewDoc] = useState<{ id: string, title?: string } | null>(null);

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

  const handleAnalyze = (id: string, title: string) => {
    setAnalysisPreviewDoc({ id, title });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Research Library</h1>
          <p className="text-text-secondary mt-1">Manage and access your uploaded research papers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-bg-elevated border border-silver-muted/20 rounded-xl p-1 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold-main text-[#0E0E10]' : 'text-text-muted hover:text-text-primary'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold-main text-[#0E0E10]' : 'text-text-muted hover:text-text-primary'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <Link to="/upload" className="btn-gold px-6 py-2.5">
            Upload New
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Search by title, author, or keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-full pl-12"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-bg-secondary border border-silver-muted/20 rounded-2xl font-semibold text-text-primary hover:bg-bg-elevated transition-all shadow-sm">
          <Filter size={20} className="text-gold-main" />
          Filters
        </button>
      </div>

      {/* Papers View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader size={40} />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-20 bg-bg-secondary rounded-3xl border border-silver-muted/20">
          <FileText size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-bold text-text-primary">No papers found</h3>
          <p className="text-text-secondary">Try adjusting your search or upload a new paper.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedPapers.map((paper) => (
            <div key={paper.id} className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden hover:border-gold-main/50 transition-all group metallic-card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-bg-elevated text-gold-main rounded-2xl relative border border-silver-muted/10">
                    <FileText size={24} />
                    {paper.status === 'processing' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-main rounded-full border-2 border-bg-main flex items-center justify-center">
                        <Loader2 size={10} className="animate-spin text-[#0E0E10]" />
                      </div>
                    )}
                  </div>
                  <div className="relative group/menu">
                    <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-all border border-transparent hover:border-silver-muted/20">
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated rounded-2xl shadow-xl border border-silver-muted/20 py-2 hidden group-hover/menu:block z-20">
                      <button onClick={() => setViewerDocumentId(paper.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary hover:text-gold-main transition-colors">
                        <Eye size={16} /> View Document
                      </button>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary hover:text-gold-main transition-colors">
                        <Download size={16} /> Download PDF
                      </a>
                      <div className="h-px bg-silver-muted/10 my-1"></div>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
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
                    <span key={i} className="px-2 py-1 bg-bg-elevated text-silver-main text-[10px] font-bold uppercase tracking-wider rounded-md border border-silver-muted/20">
                      {k}
                    </span>
                  ))}
                  {paper.keywords && paper.keywords.length > 2 && (
                    <span key="more" className="px-2 py-1 bg-bg-elevated text-silver-main text-[10px] font-bold uppercase tracking-wider rounded-md border border-silver-muted/20">
                      +{paper.keywords.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-silver-muted/10">
                  <span className="text-xs font-bold text-text-muted">{paper.year}</span>
                  <button 
                    onClick={() => handleAnalyze(paper.id, paper.title)}
                    className="text-sm font-bold text-gold-main hover:text-gold-hover flex items-center gap-1 transition-colors"
                  >
                    Analyze <TrendingUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-elevated/50 border-b border-silver-muted/10">
                <th className="px-8 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Paper Title</th>
                <th className="px-8 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Authors</th>
                <th className="px-8 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Year</th>
                <th className="px-8 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Upload Date</th>
                <th className="px-8 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver-muted/5">
              {paginatedPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-bg-elevated/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-bg-elevated text-gold-main rounded-lg relative border border-silver-muted/10">
                        <FileText size={18} />
                        {paper.status === 'processing' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-main rounded-full border border-bg-secondary flex items-center justify-center">
                            <Loader2 size={8} className="animate-spin text-[#0E0E10]" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary group-hover:text-gold-main transition-colors">{paper.title}</span>
                        {paper.status === 'processing' && (
                          <span className="text-[10px] font-bold text-silver-main uppercase tracking-wider">Processing...</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{paper.authors.join(', ')}</td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{paper.year}</td>
                  <td className="px-8 py-5 text-sm text-text-secondary">{formatDate(paper.uploadDate)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewerDocumentId(paper.id)} className="p-2 text-text-muted hover:text-gold-main hover:bg-gold-main/10 rounded-lg transition-all border border-transparent hover:border-gold-main/20">
                        <Eye size={18} />
                      </button>
                      <button 
                         onClick={() => handleAnalyze(paper.id, paper.title)}
                         className="p-2 text-text-muted hover:text-gold-main hover:bg-gold-main/10 rounded-lg transition-all border border-transparent hover:border-gold-main/20"
                      >
                         <TrendingUp size={18} />
                      </button>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-all border border-transparent hover:border-silver-muted/20">
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
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
          <p className="text-sm text-text-muted">Showing <span className="font-bold text-text-primary">{paginatedPapers.length}</span> of <span className="font-bold text-text-primary">{filteredPapers.length}</span> papers</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-silver-muted/20 rounded-xl hover:bg-bg-elevated text-text-primary transition-all disabled:opacity-20"
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl font-bold transition-all border",
                  currentPage === page 
                    ? "bg-gold-main text-[#0E0E10] border-gold-main shadow-lg shadow-gold-main/20" 
                    : "bg-bg-secondary text-text-muted border-silver-muted/10 hover:border-silver-muted/30 hover:text-text-primary"
                )}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-silver-muted/20 rounded-xl hover:bg-bg-elevated text-text-primary transition-all disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <DocumentViewerModal 
        isOpen={!!viewerDocumentId} 
        onClose={() => setViewerDocumentId(null)} 
        documentId={viewerDocumentId} 
      />

      <AnalysisPreviewModal 
        isOpen={!!analysisPreviewDoc}
        onClose={() => setAnalysisPreviewDoc(null)}
        documentId={analysisPreviewDoc?.id || null}
        documentTitle={analysisPreviewDoc?.title}
      />
    </div>
  );
}
