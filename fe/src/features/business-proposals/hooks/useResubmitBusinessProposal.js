import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resubmitBusinessProposal } from '@/features/business-proposals/services/businessProposalsApi';

export default function useResubmitBusinessProposal() {
  const queryClient = useQueryClient();

  return useMutation(resubmitBusinessProposal, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
    },
  });
}
