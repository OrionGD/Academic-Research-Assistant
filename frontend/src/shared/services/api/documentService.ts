import apiClient, { getSessionId, API_BASE_URL } from './client';
import { Document, DocumentViewMetadata } from '../../../types/api';

/**
 * Documents API Service
 * Handles document uploads, retrieval, and management
 */

const normalizeDocument = (doc: any): Document => {
  // Backend returns Mongo documents with _id or documentId; frontend expects id
  const id = doc.id || doc._id || doc.documentId || doc.document_id;
  
  // Use existing fileUrl or construct one for reliability
  let fileUrl = doc.fileUrl || `/api/documents/${id}/download`;

  // 1. Ensure absolute URL pointing to the backend (if not using relative proxy)
  if (fileUrl.startsWith('/') && API_BASE_URL.startsWith('http')) {
    try {
      // Use URL origin to get the host part (e.g., http://127.0.0.1:2022)
      const apiHost = new URL(API_BASE_URL).origin;
      fileUrl = `${apiHost}${fileUrl}`;
    } catch (e) {
      // Fallback if API_BASE_URL is not a full URL
      const apiHost = API_BASE_URL.replace(/\/api\/?$/, '');
      if (apiHost) fileUrl = `${apiHost}${fileUrl}`;
    }
  }
  
  // 2. Inject sessionId into fileUrl for direct browser navigation (downloads/viewing)
  if (fileUrl && !fileUrl.includes('sessionId=')) {
    const sid = getSessionId();
    const separator = fileUrl.includes('?') ? '&' : '?';
    fileUrl = `${fileUrl}${separator}sessionId=${sid}`;
  }

  return {
    ...doc,
    id,
    fileUrl,
  };
};

export const documentService = {
  /**
   * Upload a new research document
   */
  uploadDocument: async (file: File, title?: string, author?: string, collection?: string, onProgress?: (progress: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    if (author) {
      formData.append('author', author);
    }
    if (collection) {
      formData.append('collection', collection);
    }

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
  getDocuments: async (page: number = 1, limit: number = 20): Promise<{ documents: Document[], total: number, completedCount: number }> => {
    const response = await apiClient.get<{ documents: Document[], total: number, completedCount: number }>(
      '/documents',
      { params: { page, limit } },
    );
    const data = response.data;
    const docs = (Array.isArray(data) ? data : (data.documents ?? [])) as any[];
    return {
      documents: docs.map(normalizeDocument),
      total: (data as any).total ?? docs.length,
      completedCount: (data as any).completedCount ?? docs.filter(d => d.status === 'completed').length
    };
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
   * Fetch document as a Blob for secure viewing
   */
  getDocumentBlob: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      params: { inline: true },
      responseType: 'blob'
    });
    return response.data;
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
    const data = response.data;
    
    // Normalize the viewUrl to be relative (leveraging Vite proxy) and include sessionId
    if (data.viewUrl) {
      // Ensure /api prefix is present for relative document paths
      if (data.viewUrl.startsWith('/documents/')) {
        data.viewUrl = '/api' + data.viewUrl;
      }
      
      // If it's already absolute and points to our backend, make it relative to the proxy
      if (data.viewUrl.startsWith('http')) {
        try {
          const url = new URL(data.viewUrl);
          const apiUrl = new URL(API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://localhost${API_BASE_URL}`);
          if (url.host === apiUrl.host) {
            data.viewUrl = url.pathname + url.search;
          }
        } catch (e) { /* ignore */ }
      }
      if (!data.viewUrl.includes('sessionId=')) {
        const sid = getSessionId();
        const separator = data.viewUrl.includes('?') ? '&' : '?';
        data.viewUrl = `${data.viewUrl}${separator}sessionId=${sid}`;
      }
    }
    
    return data;
  },

  /**
   * Upload a document from a URL
   */
  uploadFromUrl: async (url: string, title?: string, collection?: string): Promise<Document> => {
    const response = await apiClient.post('/documents/upload-url', { url, title, collection });
    const doc = (response.data as any).document || response.data;
    return normalizeDocument(doc);
  },

  /**
   * Upload a document from raw text
   */
  uploadFromText: async (text: string, title?: string, collection?: string): Promise<Document> => {
    const response = await apiClient.post('/documents/upload-text', { text, title, collection });
    const doc = (response.data as any).document || response.data;
    return normalizeDocument(doc);
  },

  /**
   * Run semantic analysis on a specific document
   */
  analyzeDocument: async (id: string): Promise<void> => {
    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid document ID');
    }
    await apiClient.post(`/documents/${id}/analyze`);
  },

  /**
   * Clear all data for the current session
   */
  clearSession: async (): Promise<void> => {
    await apiClient.post('/documents/session/clear');
  }
};
