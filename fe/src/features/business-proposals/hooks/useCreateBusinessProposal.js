import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBusinessProposal } from '@/features/business-proposals/services/businessProposalsApi';

export default function useCreateBusinessProposal() {
  const queryClient = useQueryClient();
  return useMutation(createBusinessProposal, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-proposals'] }),
  });
}
