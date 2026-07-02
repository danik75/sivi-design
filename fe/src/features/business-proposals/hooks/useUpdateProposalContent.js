import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBusinessProposalContent } from '@/features/business-proposals/services/businessProposalsApi';

export default function useUpdateProposalContent() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, contentJson }) => updateBusinessProposalContent(id, contentJson),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['business-proposal', variables.id] });
      },
    },
  );
}
