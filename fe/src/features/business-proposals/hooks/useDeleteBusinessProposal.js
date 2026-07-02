import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBusinessProposal } from '@/features/business-proposals/services/businessProposalsApi';

export default function useDeleteBusinessProposal() {
  const queryClient = useQueryClient();
  return useMutation(deleteBusinessProposal, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-proposals'] }),
  });
}
