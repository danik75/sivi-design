import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateContract } from '@/features/contracts/services/contractsApi';

export default function useDeactivateContract() {
  const queryClient = useQueryClient();
  return useMutation(deactivateContract, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
