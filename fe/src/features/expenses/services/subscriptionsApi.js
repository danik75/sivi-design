import api from '@/services/api';

export const getSubscriptions = (params) =>
  api.get('/subscriptions', { params }).then((r) => r.data);
export const getSubscriptionSummary = () =>
  api.get('/subscriptions/summary').then((r) => r.data);
export const createSubscription = (data) =>
  api.post('/subscriptions', data).then((r) => r.data);
export const updateSubscription = ({ id, ...data }) =>
  api.put(`/subscriptions/${id}`, data).then((r) => r.data);
export const deactivateSubscription = (id) =>
  api.patch(`/subscriptions/${id}/deactivate`).then((r) => r.data);
