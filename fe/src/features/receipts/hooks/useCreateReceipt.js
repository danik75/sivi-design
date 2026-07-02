import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export default function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation(
    (data) => api.post('/receipts', data).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['receipts']);
        qc.invalidateQueries(['invoices']);
      },
    },
  );
}
