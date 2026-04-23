import { useState, useEffect, useCallback } from 'react';
import { documentsService } from '../services/api/documentsService';
import { Document } from '../../types/api';
import { toast } from 'sonner';

export function useDocuments() {
  const [data, setData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsService.getDocuments(page, limit);
      setData(docs);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
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
      const newDoc = await documentsService.uploadDocument(file, (progress) => {
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
      await documentsService.deleteDocument(id);
      setData(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (err) {
      // Error handled by interceptor
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    data,
    loading,
    uploadProgress,
    error,
    actions: {
      fetchDocuments,
      uploadDocument,
      deleteDocument,
      getDocument: documentsService.getDocumentById,
      compareDocuments: documentsService.compareDocuments
    }
  };
}
