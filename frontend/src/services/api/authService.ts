import apiClient from './client';
import { User, UpdateUserPayload } from '../../types/api';

/**
 * Auth API Service
 */
export const authService = {
  login: async (idToken: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/login', { idToken });
    return response.data;
  },

  register: async (data: any): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateUserPayload): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  }
};
