import axios from 'axios';

// Dynamically use the exact matching hostname so local LAN requests 
// aren't flagged as cross-site origin, preventing dropped session cookies.
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let csrfToken: string | null = null;

/**
 * Flush the cached CSRF token — call this after login and after logout
 * so the next mutating request fetches a fresh token for the new session.
 */
export function clearCsrfCache() {
  csrfToken = null;
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await api.get('/auth/csrf');
  csrfToken = res.data?.csrf_token || null;
  return csrfToken;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const unsafe = !['get', 'head', 'options'].includes(method);
  if (unsafe) {
    const token = await ensureCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      // Match backend default header name
      (config.headers as any)['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// Response interceptor to handle universal errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Cookie-session auth: clear any cached frontend auth state and redirect.
      clearCsrfCache();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
