import apiClient from './client';
import { AnalysisResult } from '../../types/api';

/**
 * AI Analysis API Service
 */
export const analysisService = {
  getDocumentAnalysis: async (id: string): Promise<AnalysisResult> => {
    const response = await apiClient.get<AnalysisResult>(`/documents/${id}/analysis`);
    return response.data;
  },

  startAnalysis: async (documentId: string): Promise<{ jobId: string }> => {
    const response = await apiClient.post('/analysis/start', { documentId });
    return response.data;
  }
};
