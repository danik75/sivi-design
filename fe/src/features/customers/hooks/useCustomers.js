import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../services/customersApi';

export default function useCustomers({ search, page }) {
  return useQuery(['customers', search, page], () => getCustomers({ search, page, limit: 25 }), {
    keepPreviousData: true,
  });
}
