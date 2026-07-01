import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInvoice } from '@/features/invoices/services/invoicesApi';

export default function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation(deleteInvoice, {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
