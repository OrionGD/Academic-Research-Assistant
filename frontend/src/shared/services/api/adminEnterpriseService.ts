import apiClient from './client';
import { User, Project, SystemSettings, AuditLog } from '../../../types/api';

/**
 * Enterprise Admin API Service
 */
export const adminEnterpriseService = {
  // Projects
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/admin/projects');
    return response.data;
  },
  
  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post<Project>('/admin/projects', data);
    return response.data;
  },
  
  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/admin/projects/${id}`, data);
    return response.data;
  },
  
  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/projects/${id}`);
  },
  
  // User Roles
  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await apiClient.patch<User>(`/admin/users/${id}/role`, { role });
    return response.data;
  },
  
  // System Settings
  getSettings: async (): Promise<any> => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },
  
  updateSettings: async (data: any): Promise<any> => {
    const response = await apiClient.patch('/admin/settings', data);
    return response.data;
  },
  
  // Audit Logs
  getAuditLogs: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/audit-logs');
    return response.data;
  }
};
