import { useState, useEffect } from 'react';
import { adminService } from '../services/api/adminService';
import { documentsService } from '../services/api/documentsService';
import { SystemMetrics, Document } from '../types/api';

export function useDashboard() {
  const [data, setData] = useState<{ metrics: SystemMetrics | null; recentDocuments: Document[] }>({
    metrics: null,
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, docsData] = await Promise.all([
        adminService.getSystemMetrics(),
        documentsService.getDocuments()
      ]);
      setData({
        metrics: metricsData,
        recentDocuments: docsData.slice(0, 5)
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    actions: {
      refresh: fetchDashboardData
    }
  };
}
