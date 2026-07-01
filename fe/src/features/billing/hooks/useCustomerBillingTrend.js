import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function useCustomerBillingTrend(customerId, params) {
  return useQuery(
    ['billing-customer-trend', customerId, params],
    () => api.get(`/billing/customer/${customerId}/trend`, { params }).then((r) => r.data),
    { enabled: Boolean(customerId) },
  );
}
