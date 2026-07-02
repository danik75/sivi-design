import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export default function useDeleteReceipt() {
  const qc = useQueryClient();
  return useMutation(
    ({ id, revertInvoice }) =>
      api.delete(`/receipts/${id}`, { data: { revertInvoice } }).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['receipts']);
        qc.invalidateQueries(['invoices']);
      },
    },
  );
}
