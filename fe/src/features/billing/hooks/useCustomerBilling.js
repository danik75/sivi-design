import { useQuery } from '@tanstack/react-query';
import { getCustomerBilling } from '@/features/billing/services/billingApi';

export default function useCustomerBilling(customerId, params) {
  return useQuery(
    ['billing-customer', customerId, params],
    () => getCustomerBilling(customerId, params),
    { enabled: Boolean(customerId) },
  );
}
