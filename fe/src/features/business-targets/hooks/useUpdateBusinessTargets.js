import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export default function useUpdateBusinessTargets() {
  const qc = useQueryClient();
  return useMutation(
    (data) => api.put('/business-targets', data).then((r) => r.data),
    { onSuccess: () => qc.invalidateQueries(['business-targets']) }
  );
}
