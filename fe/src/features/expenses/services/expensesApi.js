import api from '@/services/api';

export const getExpenses = (params) => api.get('/expenses', { params }).then((r) => r.data);
export const getExpense = (id) => api.get(`/expenses/${id}`).then((r) => r.data);
export const createExpense = (data) => api.post('/expenses', data).then((r) => r.data);
export const deactivateExpense = (id) =>
  api.patch(`/expenses/${id}/deactivate`).then((r) => r.data);
