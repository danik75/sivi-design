import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '@/features/invoices/services/invoicesApi';

export default function useInvoices({ customerId, contractId, status } = {}) {
  return useQuery(
    ['invoices', customerId, contractId, status],
    () => getInvoices({ customerId, contractId, status }),
    { keepPreviousData: true }
  );
}
