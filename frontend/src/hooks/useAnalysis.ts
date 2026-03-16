import { useState, useCallback, useEffect, useRef } from 'react';
import { analysisService } from '../services/api/analysisService';
import { AnalysisResult } from '../types/api';
import { documentsService } from '../services/api/documentsService';

export function useAnalysis() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const getAnalysis = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.getDocumentAnalysis(documentId);
      setData(result);
      clearPolling();
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Analysis not yet available, start polling if document is processing
        const doc = await documentsService.getDocumentById(documentId);
        if (doc.status === 'processing') {
          startPolling(documentId);
        } else {
          setError('Analysis not available for this document');
        }
      } else {
        setError('Failed to fetch analysis');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = (documentId: string) => {
    clearPolling();
    pollingInterval.current = setInterval(async () => {
      try {
        const result = await analysisService.getDocumentAnalysis(documentId);
        setData(result);
        clearPolling();
      } catch (err) {
        // Continue polling
      }
    }, 5000);
  };

  const startAnalysis = async (documentId: string) => {
    setLoading(true);
    try {
      await analysisService.startAnalysis(documentId);
      startPolling(documentId);
    } catch (err) {
      setError('Failed to start analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  return {
    data,
    loading,
    error,
    actions: {
      getAnalysis,
      startAnalysis
    }
  };
}
