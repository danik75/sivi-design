import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContract } from '@/features/contracts/services/contractsApi';

export default function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation(createContract, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
