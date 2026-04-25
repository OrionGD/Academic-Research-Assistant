import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * ScholarAI Open Access API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:2022/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

let lastToastTime = 0;
const TOAST_THROTTLE = 3000;

const showThrottledToast = (message: string, type: 'error' | 'warning' = 'error') => {
  const now = Date.now();
  if (now - lastToastTime > TOAST_THROTTLE) {
    if (type === 'error') toast.error(message);
    else toast.warning(message);
    lastToastTime = now;
  }
};

// ─── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      showThrottledToast('Access restricted or session issue detected.');
      return Promise.reject(error);
    }

    if (status === 429) {
      showThrottledToast('Rate limit exceeded. Please wait a moment.');
    }

    if (!status && error.code === 'ERR_NETWORK') {
      showThrottledToast('Cannot connect to server. Please check your connection.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
