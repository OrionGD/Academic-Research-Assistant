import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentViewMetadata } from '../types/api';
import apiClient from '../services/api/client';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
}

export default function DocumentViewerModal({ isOpen, onClose, documentId }: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<DocumentViewMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setMetadata(null);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<DocumentViewMetadata>(`/documents/${documentId}/view`);
        setMetadata(response.data);
      } catch (err: any) {
        console.error('Failed to load document metadata:', err);
        setError(err.response?.data?.error || 'Failed to load document view.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [isOpen, documentId]);

  // Construct absolute URL for the iframe, needed because the API client adds auth headers automatically
  // but iframes do not. However, we have a route that checks cookie/session, waiting to see, wait!
  // If the API requires Authorization header, an iframe won't send it unless we use a temporary token
  // or a signed URL. Since we didn't implement signed URLs, we will fetch the content via blob
  // and construct an object URL.

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!metadata?.viewUrl) return;

    let isActive = true;
    const fetchBlob = async () => {
      try {
        setLoading(true);
        // We use apiClient to implicitly attach the Authorization token
        const response = await apiClient.get(metadata.viewUrl, { responseType: 'blob' });
        
        if (!isActive) return;
        
        const url = URL.createObjectURL(response.data);
        setBlobUrl(url);
      } catch (err: any) {
        if (!isActive) return;
        setError('Failed to fetch document content.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchBlob();

    return () => {
      isActive = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [metadata]);


  const handleDownload = () => {
    if (documentId) {
       window.open(`http://localhost:5000/api/documents/${documentId}/download`, '_blank'); // Needs real token if strictly protected, or we can use Blob download
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
                    onClick={() => {
                        // Better to fetch the blob again as an attachment, but href download is easier if we have the blob url
                        if (blobUrl) {
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = metadata.name || 'document.pdf';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                    }}
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
                  <p className="text-sm font-medium text-text-secondary">Loading document securely...</p>
                </div>
              )}

              {error && (
                <div className="text-center max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-red-400 mb-2">View Error</h4>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              )}

              {blobUrl && !error && (
                <iframe
                  src={blobUrl}
                  className="w-full h-full border-none bg-white"
                  title="Document Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
