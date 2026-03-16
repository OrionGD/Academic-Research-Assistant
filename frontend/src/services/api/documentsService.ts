import apiClient from './client';
import { Document } from '../../types/api';

/**
 * Documents API Service
 * Handles document uploads, retrieval, and management
 */

export const documentsService = {
  /**
   * Upload a new research document
   */
  uploadDocument: async (file: File, onProgress?: (progress: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  /**
   * Fetch all documents for the current user.
   * The backend returns a paginated envelope:
   *   { documents: Document[], page, limit, totalPages, total }
   * We unwrap it here so callers always receive a plain Document[].
   */
  getDocuments: async (page: number = 1, limit: number = 20): Promise<Document[]> => {
    const response = await apiClient.get<{ documents: Document[] } | Document[]>(
      '/documents',
      { params: { page, limit } },
    );
    // Handle both paginated envelope and legacy plain-array responses.
    const data = response.data as any;
    return Array.isArray(data) ? data : (data.documents ?? []);
  },

  /**
   * Get details for a specific document
   */
  getDocumentById: async (id: string): Promise<Document> => {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete a document by ID
   */
  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  /**
   * Compare multiple documents for cross-referencing
   */
  compareDocuments: async (documentIds: string[]): Promise<any> => {
    const response = await apiClient.post('/documents/compare', { documentIds });
    return response.data;
  }
};
