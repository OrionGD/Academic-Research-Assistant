import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api/adminService';
import { documentsService } from '../services/api/documentsService';
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

    // Use allSettled so a 403 on metrics does NOT kill the whole dashboard.
    // Documents (the primary content) will still render even if admin metrics
    // are unavailable for the current user role.
    const [metricsResult, docsResult] = await Promise.allSettled([
      adminService.getSystemMetrics(),
      documentsService.getDocuments(),
    ]);

    const metrics =
      metricsResult.status === 'fulfilled' ? metricsResult.value : null;

    const recentDocuments =
      docsResult.status === 'fulfilled' ? docsResult.value.slice(0, 5) : [];

    // Surface a hard error only when BOTH calls fail.
    if (metricsResult.status === 'rejected' && docsResult.status === 'rejected') {
      setError('Failed to load dashboard data');
    }

    setData({ metrics, recentDocuments });
    setLoading(false);
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
