import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBusinessProposalLifecycle } from '@/features/business-proposals/services/businessProposalsApi';

export default function useUpdateBusinessProposalLifecycle() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, lifecycleStatus }) => updateBusinessProposalLifecycle(id, lifecycleStatus),
    {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-proposals'] }),
    }
  );
}
