import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  User, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/helpers';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DocumentsPage() {
  const { data: documents, loading, actions } = useDocuments();
  const { setUploadModalOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(search.toLowerCase()) || 
    (doc.authors && Array.isArray(doc.authors) && doc.authors.some((a: string) => a.toLowerCase().includes(search.toLowerCase())))
  );

  // Auto-refresh logic for processing documents
  useEffect(() => {
    actions.fetchDocuments();
    
    // Check if any document is in processing state
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'pending');
    
    let interval: NodeJS.Timeout | null = null;
    if (hasProcessing) {
      interval = setInterval(() => {
        actions.fetchDocuments();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [documents.some(d => d.status === 'processing' || d.status === 'pending')]);

  return (
    <div className="h-full bg-[#020203] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Source Management</h1>
            <p className="text-text-dim mt-1">Ingest, preprocess, and manage your research knowledge base.</p>
          </div>
          <button 
            onClick={() => setUploadModalOpen(true)}
            className="bg-accent hover:bg-accent-light text-white flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Ingest New Source</span>
          </button>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, author, or metadata..." 
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-14 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all shadow-lg"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-xs font-bold text-text-dim hover:text-text-primary hover:bg-white/[0.05] transition-all uppercase tracking-widest">
                <Filter size={16} />
                Filters
             </button>
          </div>
        </div>

        {/* Document Grid */}
        {loading && documents.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin text-accent" size={40} />
             <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Accessing Knowledge Base...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bb-premium-card py-32 flex flex-col items-center justify-center text-center border-dashed border-white/10">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-text-dim mb-6 border border-white/5">
              <FileText size={36} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No documents found</h3>
            <p className="text-text-dim max-w-sm mb-8 leading-relaxed">
              {search ? `No results for "${search}". Try a different keyword.` : "Begin by uploading PDFs for AI preprocessing."}
            </p>
            {!search && (
              <button 
                onClick={() => setUploadModalOpen(true)}
                className="bg-accent hover:bg-accent-light text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20 active:scale-95"
              >
                Add Your First Source
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocs.map((doc: any) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bb-premium-card group hover:border-accent/30 p-6 space-y-4 cursor-pointer"
                onClick={() => navigate(`/analytics/${doc.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    doc.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                    doc.status === 'processing' ? "bg-accent/10 border-accent/20 text-accent" : 
                    "bg-white/5 border-white/10 text-text-dim"
                  )}>
                    {doc.status === 'completed' ? <CheckCircle2 size={24} /> : 
                     doc.status === 'processing' ? <Loader2 size={24} className="animate-spin" /> : 
                     <FileText size={24} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(doc.fileUrl, '_blank');
                      }}
                      className="p-2 text-text-dim hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete logic would go here
                      }}
                      className="p-2 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-text-primary line-clamp-2 leading-relaxed group-hover:text-accent transition-colors">
                    {doc.title || 'Untitled Source'}
                  </h3>
                  <p className="text-[11px] text-text-dim uppercase font-bold tracking-widest truncate">
                    {doc.authors?.join(', ') || 'Unknown Author'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.03] grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-text-dim">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{doc.year || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-dim justify-end">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Preprocessing Indicators */}
                <div className="flex flex-wrap gap-2 mt-4">
                   <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-text-dim uppercase tracking-widest">OCR Ready</div>
                   <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-text-dim uppercase tracking-widest">Neural Chunking</div>
                   {doc.status === 'completed' && <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Vectorized</div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
