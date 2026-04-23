import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * Enterprise Session-Based API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  withCredentials: true, // Crucial for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401: Session expired or invalid
    if (status === 401) {
      // Only redirect if not already on a public page
      const publicPages = ['/', '/login', '/signup', '/pricing', '/documentation', '/support', '/api-reference'];
      const isPublicPage = publicPages.includes(window.location.pathname);
      
      if (!isPublicPage) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Role-based errors
    if (status === 403) {
      toast.error('Access denied. Admin privileges required.');
    }

    // Rate limits
    if (status === 429) {
      toast.error('Rate limit exceeded. Please wait a moment.');
    }

    // Network / Server errors
    if (!status && error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Is it running?');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
