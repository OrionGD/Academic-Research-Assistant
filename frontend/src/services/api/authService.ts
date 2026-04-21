import apiClient from './client';
import { User, UpdateUserPayload } from '../../types/api';

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Auth API Service (JWT)
 */
export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateUserPayload): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: any): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/auth/change-password', data);
    return response.data;
  }
};
