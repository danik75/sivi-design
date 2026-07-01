import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '@/features/invoices/services/invoicesApi';

export default function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation(createInvoice, {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
