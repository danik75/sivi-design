import api from '@/services/api';

export const getInvoices = (params) => api.get('/invoices', { params }).then((r) => r.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then((r) => r.data);
export const createInvoice = (data) => api.post('/invoices', data).then((r) => r.data);
export const updateInvoice = ({ id, ...data }) =>
  api.put(`/invoices/${id}`, data).then((r) => r.data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`).then((r) => r.data);
export const transitionInvoiceStatus = ({ id, status }) =>
  api.patch(`/invoices/${id}/status`, { status }).then((r) => r.data);
export const prefillInvoice = (contractId) =>
  api.get(`/invoices/prefill/${contractId}`).then((r) => r.data);
export const getAvailableTasks = (customerId, excludeInvoiceId) =>
  api
    .get('/invoices/available-tasks', { params: { customerId, excludeInvoiceId } })
    .then((r) => r.data);
export const getAvailableExpenses = (customerId, excludeInvoiceId, search) =>
  api
    .get('/invoices/available-expenses', { params: { customerId, excludeInvoiceId, search } })
    .then((r) => r.data);
