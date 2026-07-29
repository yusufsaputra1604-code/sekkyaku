import axios from 'axios';

function buildBaseUrl(url) {
  if (!url) return '/api';
  const clean = url.replace(/\/api\/?$/, '');
  return clean + '/api';
}

const api = axios.create({
  baseURL: buildBaseUrl(localStorage.getItem('api_url') || ''),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setApiUrl = (url) => {
  const clean = url.replace(/\/api\/?$/, '');
  localStorage.setItem('api_url', clean);
  api.defaults.baseURL = buildBaseUrl(clean);
};

export const getApiUrl = () => {
  return localStorage.getItem('api_url') || '';
};

export default api;
