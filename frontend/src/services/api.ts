/**
 * Services for API communication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Document Services
export const documentService = {
  uploadPDF: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadURL: (url: string, title?: string) => {
    return apiClient.post('/documents/upload-url', { url, title });
  },

  uploadText: (text: string, title?: string) => {
    return apiClient.post('/documents/upload-text', { text, title });
  },

  listDocuments: (skip = 0, limit = 10) => {
    return apiClient.get('/documents/', { params: { skip, limit } });
  },

  getAnalytics: (documentId: string) => {
    return apiClient.get(`/documents/${documentId}/analytics`);
  },

  deleteDocument: (documentId: string) => {
    return apiClient.delete(`/documents/${documentId}`);
  }
};

// Chat Services
export const chatService = {
  query: (documentId: string, query: string, userId?: string) => {
    return apiClient.post('/chat/query', {
      document_id: documentId,
      query,
      user_id: userId
    });
  },

  getHistory: (documentId: string, skip = 0, limit = 20) => {
    return apiClient.get(`/chat/history/${documentId}`, {
      params: { skip, limit }
    });
  }
};

export default apiClient;
