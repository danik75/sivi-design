import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/features/customers/services/customersApi';

export default function useCustomers({ search, page, limit = 25 } = {}) {
  return useQuery(['customers', search, page, limit], () => getCustomers({ search, page, limit }), {
    keepPreviousData: true,
  });
}
