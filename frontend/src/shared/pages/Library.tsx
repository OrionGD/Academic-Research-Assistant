import { useState, useMemo, useEffect } from 'react';
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
  Loader2,
  GitCompare,
  Check,
  X
} from 'lucide-react';
import { useDocuments } from '../../shared/hooks/useDocuments';
import { formatDate, cn } from '../../utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import { TableRowSkeleton, Loader } from '../../shared/components/LoadingStates';
import DocumentViewerModal from '../../shared/components/DocumentViewerModal';
import AnalysisPreviewModal from '../../shared/components/AnalysisPreviewModal';
import { documentService } from '../../shared/services/api/documentService';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';

export default function LibraryPage() {
  const { t } = useLanguage();
  const { data: documents, loading: isLoading, actions } = useDocuments();
  
  useEffect(() => {
    // Standard mount fetch
    actions.fetchDocuments();
  }, []);
  const { deleteDocument: removeDocument } = actions;
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
  const [analysisPreviewDoc, setAnalysisPreviewDoc] = useState<{ id: string, title?: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCompareSelected = () => {
    if (selectedIds.size < 2) {
      toast.error(t('selectAtLeastTwo') || 'Select at least 2 documents to compare');
      return;
    }
    navigate('/compare', { state: { documentIds: Array.from(selectedIds) } });
  };

  const filteredPapers = useMemo(() => {
    return documents.filter((p: any) =>
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.authors || []).some((a: any) => (a || '').toLowerCase().includes(searchQuery.toLowerCase()))
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('researchLibrary') || 'Research Library'}</h1>
          <p className="text-text-dim mt-1">{t('managePapers') || 'Manage and explore your synchronized research collection.'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-accent text-white shadow-lg" : "text-text-dim hover:text-text-primary"
              )}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-accent text-white shadow-lg" : "text-text-dim hover:text-text-primary"
              )}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Link to="/upload" className="bg-accent hover:bg-accent-light text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-accent/20">
            {t('uploadNew') || 'Upload Paper'}
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
          <input
            type="text"
            placeholder={t('searchPlaceholder') || "Search library..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl font-bold text-text-primary hover:bg-white/[0.05] transition-all">
          <Filter size={18} className="text-accent" />
          {t('filters') || 'Filters'}
        </button>
      </div>

        {/* Papers View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
           <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-24 bb-premium-card border-white/5">
          <FileText size={48} className="mx-auto text-text-dim mb-4" />
          <h3 className="text-lg font-bold text-text-primary">{t('noPapers') || 'No papers found'}</h3>
          <p className="text-text-dim">{t('noPapersHint') || 'Try adjusting your search or upload a new document.'}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedPapers.map((paper) => (
            <div key={paper.id} className="bb-premium-card p-6 border-white/5 hover:border-accent/20 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/5 text-accent rounded-2xl relative border border-white/10 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                  {paper.status === 'processing' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#020203] flex items-center justify-center">
                      <Loader2 size={10} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelection(paper.id); }}
                    className={cn(
                      "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                      selectedIds.has(paper.id) ? "bg-accent border-accent text-white" : "border-white/10 hover:border-accent/40"
                    )}
                  >
                    {selectedIds.has(paper.id) && <Check size={14} />}
                  </button>
                  <div className="relative group/menu">
                    <button className="p-2 text-text-dim hover:text-text-primary hover:bg-white/10 rounded-lg transition-all border border-transparent">
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#050508] rounded-2xl shadow-2xl border border-white/10 py-2 hidden group-hover/menu:block z-20">
                      <button onClick={() => setViewerDocumentId(paper.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-white/5 hover:text-accent transition-colors">
                        <Eye size={16} /> {t('viewDocument') || 'View Document'}
                      </button>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-white/5 hover:text-accent transition-colors">
                        <Download size={16} /> {t('downloadPDF') || 'Download PDF'}
                      </a>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 size={16} /> {t('deletePaper') || 'Delete Paper'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-text-primary mb-2 line-clamp-2 min-h-[3rem] tracking-tight">{paper.title || t('untitled')}</h3>
              <p className="text-sm text-text-dim mb-4 line-clamp-1">{(paper.authors || []).join(', ') || t('unknownAuthor')}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {paper.keywords?.slice(0, 2).map((k, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-md border border-white/10 text-text-dim">
                    {k}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs font-bold text-text-dim">{paper.year || 'N/A'}</span>
                <button 
                  onClick={() => handleAnalyze(paper.id, paper.title)}
                  className="text-sm font-bold text-accent hover:text-accent-light flex items-center gap-1 transition-colors"
                >
                  {t('analyze') || 'Analyze'} <TrendingUp size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bb-premium-card border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-4"></th>
                <th className="px-8 py-4 text-[11px] font-bold text-text-dim uppercase tracking-widest">{t('paperTitle') || 'Paper Title'}</th>
                <th className="px-8 py-4 text-[11px] font-bold text-text-dim uppercase tracking-widest">{t('authors') || 'Authors'}</th>
                <th className="px-8 py-4 text-[11px] font-bold text-text-dim uppercase tracking-widest">{t('year') || 'Year'}</th>
                <th className="px-8 py-4 text-[11px] font-bold text-text-dim uppercase tracking-widest">{t('uploadDate') || 'Date'}</th>
                <th className="px-8 py-4 text-[11px] font-bold text-text-dim uppercase tracking-widest text-right">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelection(paper.id); }}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        selectedIds.has(paper.id) ? "bg-accent border-accent text-white" : "border-white/10 hover:border-accent/40"
                      )}
                    >
                      {selectedIds.has(paper.id) && <Check size={12} />}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/5 text-accent rounded-xl relative border border-white/10">
                        <FileText size={18} />
                        {paper.status === 'processing' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border border-[#020203] flex items-center justify-center">
                            <Loader2 size={8} className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-primary group-hover:text-accent transition-colors truncate max-w-[300px]">{paper.title}</span>
                        {paper.status === 'processing' && (
                          <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Processing...</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-text-dim">{(paper.authors || []).join(', ') || t('unknownAuthor')}</td>
                  <td className="px-8 py-5 text-sm text-text-dim">{paper.year || 'N/A'}</td>
                  <td className="px-8 py-5 text-sm text-text-dim">{paper.uploadDate ? formatDate(paper.uploadDate) : 'N/A'}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewerDocumentId(paper.id)} className="p-2 text-text-dim hover:text-accent hover:bg-accent/10 rounded-lg transition-all border border-transparent">
                        <Eye size={18} />
                      </button>
                      <button 
                         onClick={() => handleAnalyze(paper.id, paper.title)}
                         className="p-2 text-text-dim hover:text-accent hover:bg-accent/10 rounded-lg transition-all border border-transparent"
                      >
                         <TrendingUp size={18} />
                      </button>
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-text-dim hover:text-text-primary hover:bg-white/5 rounded-lg transition-all border border-transparent">
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(paper.id)}
                        className="p-2 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent"
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

      {/* Bulk Compare Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 bg-bg-elevated border border-gold-main/30 rounded-2xl shadow-2xl shadow-gold-main/10">
          <span className="text-sm text-text-secondary">
            <span className="font-bold text-gold-main">{selectedIds.size}</span> {t('selected') || 'selected'}
          </span>
          <button
            onClick={clearSelection}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-all"
          >
            <X size={16} />
          </button>
          <div className="h-5 w-px bg-silver-muted/20" />
          <button
            onClick={handleCompareSelected}
            disabled={selectedIds.size < 2}
            className={cn(
              "btn-gold px-4 py-2 text-sm flex items-center gap-2 transition-all",
              selectedIds.size < 2 && "opacity-50 cursor-not-allowed"
            )}
          >
            <GitCompare size={16} />
            {t('compareSelected') || 'Compare Selected'}
          </button>
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
