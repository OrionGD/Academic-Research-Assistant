import apiClient from './client';
import { User, UpdateUserPayload } from '../../../types/api';

/**
 * Auth API Service (Session-Based)
 */
export const authService = {
  login: async (credentials: any) => {
    console.log("Sending login:", credentials);
    const response = await apiClient.post('/auth/login', credentials, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json"
      }
    });
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data, {
      timeout: 15000
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  updateProfile: async (data: UpdateUserPayload): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  }
};
