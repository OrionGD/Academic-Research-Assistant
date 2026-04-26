import { useState, useCallback, useRef } from 'react';
import { documentService } from '../services/api/documentService';
import { Document } from '../../types/api';
import { toast } from 'sonner';

export function useDocuments() {
  const [data, setData] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchDocuments = useCallback(async (page: number = 1, limit: number = 20) => {
    if (isFetching.current) return;
    isFetching.current = true;
    // Prevent concurrent calls
    setLoading(prev => {
      if (prev && page === 1) return prev; // already loading first page
      return true;
    });
    setError(null);
    try {
      const result = await documentService.getDocuments(page, limit);
      setData(result.documents);
      setTotal(result.total);
      setCompletedCount(result.completedCount);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const uploadDocument = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      const newDoc = await documentService.uploadDocument(file, undefined, (progress) => {
        setUploadProgress(progress);
      });
      setData(prev => [newDoc, ...prev]);
      toast.success('Document uploaded successfully');
      return newDoc;
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setData(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (err) {
      // Error handled by interceptor
    }
  };

  return {
    data,
    total,
    completedCount,
    loading,
    uploadProgress,
    error,
    actions: {
      fetchDocuments,
      uploadDocument,
      deleteDocument,
      getDocument: documentService.getDocumentById,
      compareDocuments: documentService.compareDocuments
    }
  };
}
