import api from '@/services/api';

export const fetchTasks = (params) =>
  api.get('/tasks', { params }).then((response) => response.data);

export const fetchTask = (id) => api.get(`/tasks/${id}`).then((response) => response.data);

export const createTask = (data) => api.post('/tasks', data).then((response) => response.data);

export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data).then((response) => response.data);

export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((response) => response.data);

export const fetchCustomersLookup = () =>
  api.get('/customers', { params: { limit: 200 } }).then((response) => response.data);
