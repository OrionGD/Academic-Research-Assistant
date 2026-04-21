import apiClient from './client';
import { Document, DocumentViewMetadata } from '../../types/api';

/**
 * Documents API Service
 * Handles document uploads, retrieval, and management
 */

const normalizeDocument = (doc: any): Document => {
  // Backend returns Mongo documents with _id; frontend expects id
  const id = doc.id || doc._id;
  return {
    ...doc,
    id,
  };
};

export const documentsService = {
  /**
   * Upload a new research document
   */
  uploadDocument: async (file: File, onProgress?: (progress: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/documents/upload', formData, {
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

    // Backend wraps the document in { message, document }
    const doc = (response.data as any).document || response.data;
    return normalizeDocument(doc);
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
    const docs = Array.isArray(data) ? data : (data.documents ?? []);
    return docs.map(normalizeDocument);
  },

  /**
   * Get details for a specific document
   */
  getDocumentById: async (id: string): Promise<Document> => {
    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid document ID');
    }
    const response = await apiClient.get(`/documents/${id}`);
    return normalizeDocument(response.data);
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
  },

  /**
   * Get formatting metadata and signed view URL for a document
   */
  getViewMetadata: async (id: string): Promise<DocumentViewMetadata> => {
    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid document ID');
    }
    const response = await apiClient.get<DocumentViewMetadata>(`/documents/${id}/view`);
    return response.data;
  },

  /**
   * Run semantic analysis on a specific document
   */
  analyzeDocument: async (id: string): Promise<void> => {
    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid document ID');
    }
    await apiClient.post(`/documents/${id}/analyze`);
  }
};
