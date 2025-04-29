import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  withCredentials: true,
});

// Add request interceptor for CSRF token
api.interceptors.request.use(config => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  return config;
});

// Helper function to get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

export default api;