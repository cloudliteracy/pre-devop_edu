import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => axios.post(`${API_URL}/auth/register`, data),
  login: (data) => api.post('/auth/login', data)
};

export const moduleAPI = {
  getAll: () => api.get('/modules'),
  getById: (id) => api.get(`/modules/${id}`)
};

export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (paymentId) => api.get(`/payments/verify/${paymentId}`)
};

export const quizAPI = {
  get: (moduleId) => api.get(`/quiz/${moduleId}`),
  submit: (moduleId, answers) => api.post(`/quiz/${moduleId}/submit`, { answers })
};

export const ratingAPI = {
  submit: (rating) => api.post('/ratings', { rating }),
  getStats: () => api.get('/ratings/stats')
};

export default api;
