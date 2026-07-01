import api from '@/services/api';

export const getBillingOverview = (params) =>
  api.get('/billing/overview', { params }).then((r) => r.data);

export const getCustomerBilling = (customerId, params) =>
  api.get(`/billing/customer/${customerId}`, { params }).then((r) => r.data);

export const getBillingTrend = (params) =>
  api.get('/billing/trend', { params }).then((r) => r.data);
