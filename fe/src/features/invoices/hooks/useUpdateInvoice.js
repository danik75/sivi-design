import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvoice } from '@/features/invoices/services/invoicesApi';

export default function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation(updateInvoice, {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
