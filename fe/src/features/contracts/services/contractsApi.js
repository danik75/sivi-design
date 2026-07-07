import api from '@/services/api';

export const getContracts = (params) => api.get('/contracts', { params }).then((r) => r.data);
export const getContract = (id) => api.get(`/contracts/${id}`).then((r) => r.data);
export const getContractUsage = (id, excludeTaskId) =>
  api.get(`/contracts/${id}/usage`, { params: { excludeTaskId } }).then((r) => r.data);
export const createContract = (data) => api.post('/contracts', data).then((r) => r.data);
export const deactivateContract = (id) =>
  api.patch(`/contracts/${id}/deactivate`).then((r) => r.data);
