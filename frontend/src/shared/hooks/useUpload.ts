import { useState } from 'react';
import { documentService } from '../services/api/documentService';
import { Document } from '../../types/api';
import { toast } from 'sonner';
import apiClient from '../services/api/client';

export function useUpload() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const performUpload = async (file: File, metadata: any): Promise<Document | null> => {
    setLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiClient.post<Document>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      toast.success('Document uploaded successfully!');
      return response.data;
    } catch (err) {
      setError('Upload failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return {
    data: null,
    loading,
    error,
    uploadProgress,
    actions: {
      performUpload
    }
  };
}
