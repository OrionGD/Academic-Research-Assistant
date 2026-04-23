import { useState, useEffect } from 'react';
import { adminService } from '../services/api/adminService';
import { SystemMetrics, User } from '../../types/api';
import { toast } from 'sonner';

export function useAdmin() {
  const [data, setData] = useState<{ metrics: SystemMetrics | null; users: User[] }>({
    metrics: null,
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    try {
      const usersData = await adminService.getUsers(page, limit);
      setData(prev => ({ ...prev, users: usersData }));
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemMetrics = async () => {
    setLoading(true);
    try {
      const metricsData = await adminService.getSystemMetrics();
      setData(prev => ({ ...prev, metrics: metricsData }));
    } catch (err) {
      setError('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await adminService.deleteUser(id);
      setData(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id)
      }));
      toast.success('User deleted successfully');
      return true;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    fetchUsers();
  }, []);

  return {
    data,
    loading,
    error,
    actions: {
      fetchUsers,
      deleteUser,
      fetchSystemMetrics
    }
  };
}
