import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: false,
});

// Request interceptor placeholder for adding Authorization header
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('sivi_token');
//   if (token) {
//     config.headers = config.headers || {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Simple response interceptor for error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // eslint-disable-next-line no-console
    console.error('API error', error);
    return Promise.reject(error);
  }
);

export default api;

export function loginApi(credentials) {
  return api.post('/login', credentials).then((res) => res.data);
}
