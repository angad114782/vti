import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error(
      `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} failed:`,
      error.response ? `HTTP ${error.response.status} — ${JSON.stringify(error.response.data)}` : error.message
    );
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.warn(`[API] 401 on ${original.url} — attempting token refresh. refreshToken present: ${!!refreshToken}`);
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr: unknown) {
        const re = refreshErr as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const reason = re.response
          ? `refresh endpoint returned HTTP ${re.response.status}: ${re.response.data?.message}`
          : `refresh request never reached server: ${re.message}`;
        console.error(`[AUTH] Kicking to /login. Original call: ${original.method?.toUpperCase()} ${original.url} → 401. Refresh failed because: ${reason}`);
        alert(`Logged out: ${reason}`);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
