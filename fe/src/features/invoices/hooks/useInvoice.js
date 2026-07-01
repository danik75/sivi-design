import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '@/features/invoices/services/invoicesApi';

export default function useInvoice(id) {
  return useQuery(['invoice', id], () => getInvoice(id), {
    enabled: Boolean(id),
  });
}
