import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function useReceipts(params = {}) {
  return useQuery(
    ['receipts', params],
    () => api.get('/receipts', { params }).then((r) => r.data),
    { keepPreviousData: true },
  );
}
