import apiClient from './client';
import { AnalysisResult } from '../../../types/api';

/**
 * AI Analysis API Service
 */
export const analysisService = {
  getDocumentAnalysis: async (id: string): Promise<AnalysisResult> => {
    const response = await apiClient.get<AnalysisResult>(`/analysis/document/${id}`);
    return response.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisResult> => {
    const response = await apiClient.get<AnalysisResult>(`/analysis/${id}`);
    return response.data;
  },

  startAnalysis: async (documentId: string): Promise<{ jobId: string }> => {
    const response = await apiClient.post('/analysis/start', { documentId });
    return response.data;
  },

  compareDocuments: async (documentIds: string[]): Promise<any> => {
    const response = await apiClient.post('/analysis/compare', { documentIds });
    return response.data;
  }
};
