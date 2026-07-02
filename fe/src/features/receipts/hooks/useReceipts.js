import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function useReceipts() {
  return useQuery(['receipts'], () => api.get('/receipts').then((r) => r.data));
}
