import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Injects Authorization Header automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catches 401 and manages session expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // If unauthorized on protected routes, clear token and redirect
      if (currentPath !== '/login' && currentPath !== '/' && !currentPath.startsWith('/auth')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login?error=Session+expired.+Please+sign+in+again.';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
