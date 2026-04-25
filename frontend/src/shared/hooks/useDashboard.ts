import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/api/documentService';
import { SystemMetrics, Document } from '../../types/api';

export function useDashboard() {
  const [data, setData] = useState<{ metrics: SystemMetrics | null; recentDocuments: Document[] }>({
    metrics: null,
    recentDocuments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const documents = await documentService.getDocuments();
      setData({ 
        metrics: null, // Admin metrics removed for Open Access
        recentDocuments: documents.slice(0, 5) 
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    actions: {
      refresh: fetchDashboardData,
    },
  };
}

