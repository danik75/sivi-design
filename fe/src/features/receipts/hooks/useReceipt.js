import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function useReceipt(id) {
  return useQuery(
    ['receipts', id],
    () => api.get(`/receipts/${id}`).then((r) => r.data),
    { enabled: id != null },
  );
}
