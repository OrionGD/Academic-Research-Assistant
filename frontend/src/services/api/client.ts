import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase';
import { toast } from 'sonner';

/**
 * Secure API Client
 *
 * Responsibilities:
 * 1. Use VITE_API_URL as baseURL.
 * 2. In development, requests bypass authentication (dev server handles it).
 *    In production, Firebase ID tokens are injected into every request.
 * 3. On 401: force-refresh the Firebase token once and retry the original
 *    request before falling back to a /login redirect.
 * 4. Provide consistent, user-friendly error toasts for all other error codes.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Extend Axios config type to track the per-request retry flag.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000, // 60 s – document processing can be slow
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// In development, the backend bypasses authentication automatically.
// In production, inject the current Firebase ID token into every outgoing request.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Production: Inject Firebase token if user exists
      if (!import.meta.env.DEV) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(/* forceRefresh */ false);
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error('Security: Failed to inject auth token', err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig;
    const status = error.response?.status;

    // 401: attempt a token force-refresh and retry once.
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(/* forceRefresh */ true);
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // Refresh failed or no user → session is truly expired.
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // All other error codes — show a meaningful toast.
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
          const message =
            (error.response?.data as any)?.error?.message ||
            (error.response?.data as any)?.message ||
            'An unexpected error occurred';
          toast.error(message);
        }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
