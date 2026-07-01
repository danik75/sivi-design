import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transitionInvoiceStatus } from '@/features/invoices/services/invoicesApi';

export default function useTransitionStatus() {
  const qc = useQueryClient();
  return useMutation(transitionInvoiceStatus, {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
