import api from '../../../services/api';

export const getCustomers = (params) =>
  api.get('/customers', { params }).then((response) => response.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then((response) => response.data);
export const createCustomer = (data) =>
  api.post('/customers', data).then((response) => response.data);
export const updateCustomer = (id, data) =>
  api.put(`/customers/${id}`, data).then((response) => response.data);
export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then((response) => response.data);
