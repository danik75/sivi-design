import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function useBusinessTargets() {
  return useQuery(['business-targets'], () =>
    api.get('/business-targets').then((r) => r.data)
  );
}
