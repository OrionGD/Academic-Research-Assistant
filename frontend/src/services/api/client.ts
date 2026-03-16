import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase';
import { toast } from 'sonner';

/**
 * Secure API Client
 * 
 * Responsibilities:
 * 1. Use VITE_API_URL as baseURL
 * 2. Automatically inject Firebase ID tokens
 * 3. Handle global API errors
 * 4. Provide consistent response handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout for document processing
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Securely inject Firebase ID Token
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force refresh token if needed
        const token = await currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Security: Failed to inject auth token', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Global Error Handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // Handle specific HTTP error codes
    switch (status) {
      case 401:
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('Access denied. You do not have permission.');
        break;
      case 404:
        console.error('API Error: Resource not found', error.config?.url);
        break;
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
        toast.error('Server error. Our team has been notified.');
        break;
      default:
        if (error.code === 'ERR_NETWORK') {
          toast.error('Network error. Please check your connection.');
        } else if (status) {
          const message = (error.response?.data as any)?.message || 'An unexpected error occurred';
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
