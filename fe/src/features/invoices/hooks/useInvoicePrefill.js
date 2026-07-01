import { useQuery } from '@tanstack/react-query';
import { prefillInvoice } from '@/features/invoices/services/invoicesApi';

export default function useInvoicePrefill(contractId) {
  return useQuery(['invoice-prefill', contractId], () => prefillInvoice(contractId), {
    enabled: false,
    retry: false,
  });
}
