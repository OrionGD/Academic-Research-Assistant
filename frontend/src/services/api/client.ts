import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

/**
 * Secure API Client (JWT)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Inject the current JWT token into every outgoing request.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('aras_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401: Token expired or invalid
    if (status === 401) {
      localStorage.removeItem('aras_token');
      localStorage.removeItem('aras_user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // All other error codes
    switch (status) {
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
          const message =
            (error.response?.data as any)?.error?.message ||
            (error.response?.data as any)?.message ||
            (error.response?.data as any)?.error ||
            'An unexpected error occurred';
          toast.error(message);
        }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
