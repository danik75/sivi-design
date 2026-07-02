import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refineBusinessProposal } from '@/features/business-proposals/services/businessProposalsApi';

export default function useRefineBusinessProposal() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, refinementText }) => refineBusinessProposal(id, refinementText),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
        queryClient.invalidateQueries({ queryKey: ['business-proposal', variables.id] });
      },
    },
  );
}
