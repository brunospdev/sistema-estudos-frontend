import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/tokenStore';

const CLIENT_HEADER = 'X-StudyHub-Client';
const CLIENT_VALUE = 'studyhub-web';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  config.headers[CLIENT_HEADER] = CLIENT_VALUE;

  const isAuthRoute = config.url?.includes('/auth/login')
    || config.url?.includes('/auth/register')
    || config.url?.includes('/auth/refresh');

  const token = getAccessToken();
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthRoute = originalRequest.url?.includes('/auth/login')
        || originalRequest.url?.includes('/auth/register')
        || originalRequest.url?.includes('/auth/refresh');

      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.token);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
