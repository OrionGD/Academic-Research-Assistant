import apiClient from './client';
import { SystemMetrics, User } from '../../../types/api';

/**
 * Admin API Service
 */
export const adminService = {
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await apiClient.get<SystemMetrics>('/admin/system-metrics');
    return response.data;
  },

  getUsers: async (page: number = 1, limit: number = 20): Promise<User[]> => {
    const response = await apiClient.get<any>('/admin/users', {
      params: { page, limit }
    });
    // The backend returns { users: User[], count: number } instead of just an array
    return response.data.users || response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  }
};
