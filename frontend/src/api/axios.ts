import axios, { type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response — refresh token once on 401, then kick to /login ───
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const drainQueue = (token: string | null, err: unknown) => {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (import.meta.env.DEV) {
      console.error(
        `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} →`,
        error.response ? `HTTP ${error.response.status}` : error.message,
      );
    }

    const status = error.response?.status;
    if (status === 409) {
      toast.error(error.response?.data?.message ?? 'This record changed. Refresh and try again.');
    }
    if (status && status >= 500) {
      toast.error('Server error. Please try again.');
    }

    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry || original.url === '/auth/login') {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      drainQueue(data.accessToken, null);
      original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${data.accessToken}` };
      return api(original);
    } catch (refreshErr) {
      drainQueue(null, refreshErr);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
