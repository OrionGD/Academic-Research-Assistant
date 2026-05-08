import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentViewMetadata } from '../../types/api';
import { documentService } from '../services/api/documentService';
import { API_BASE_URL } from '../../shared/services/api/client';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
}

export default function DocumentViewerModal({ isOpen, onClose, documentId }: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<DocumentViewMetadata | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setMetadata(null);
      setTextContent(null);
      setError(null);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get Metadata
        const data = await documentService.getViewMetadata(documentId);
        setMetadata(data);

        if (data.isTextSource) {
          // 2. Fetch full document content for text sources
          const doc = await documentService.getDocumentById(documentId);
          setTextContent(doc.content || "No content found for this source.");
        } else {
          // 3. Get Blob for secure PDF viewing
          const blob = await documentService.getDocumentBlob(documentId);
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        console.error('Failed to load document:', err);
        setError('Failed to load document view safely.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, documentId]);

  const viewUrl = blobUrl;

  const handleDownload = () => {
    if (documentId) {
       const cleanBase = API_BASE_URL.replace(/\/$/, '');
       window.open(`${cleanBase}/documents/${documentId}/download?sessionId=${localStorage.getItem('scholarai_session_id') || 'public'}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-main/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-bg-secondary border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <FileText className="text-indigo-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary line-clamp-1">
                    {metadata?.name || 'Document Viewer'}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5 uppercase tracking-wide font-medium">
                    {metadata?.mimeType || 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {metadata && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-white bg-bg-main hover:bg-indigo-500/20 border border-border-subtle hover:border-indigo-500/50 rounded-lg transition-all"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-text-muted hover:text-white hover:bg-red-500/20 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-black/40 overflow-hidden flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-secondary/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-medium text-text-secondary">Loading source content...</p>
                </div>
              )}

              {error && (
                <div className="text-center max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-red-400 mb-2">View Error</h4>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              )}

              {metadata?.isTextSource && !loading && !error && (
                <div className="w-full h-full p-8 md:p-12 overflow-y-auto custom-scrollbar bg-bg-main selection:bg-accent/30">
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 backdrop-blur-sm">
                      <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">Source Type: {metadata.mimeType}</p>
                      <h2 className="text-2xl font-bold text-text-primary tracking-tight">{metadata.name}</h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                       <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-text-secondary/90 bg-transparent border-none p-0">
                         {textContent}
                       </pre>
                    </div>
                  </div>
                </div>
              )}

              {!metadata?.isTextSource && viewUrl && !error && (
                <object
                  data={viewUrl}
                  type="application/pdf"
                  className="w-full h-full bg-white rounded-b-xl"
                >
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-bg-secondary">
                    <FileText className="w-16 h-16 text-text-muted mb-4" />
                    <h4 className="text-xl font-bold text-text-primary mb-2">Unable to display PDF</h4>
                    <p className="text-text-secondary mb-6 max-w-sm">
                      Your browser's PDF plugin might be blocked or unavailable. 
                      Try downloading the file to view it.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
                    >
                      Download Document
                    </button>
                  </div>
                </object>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
