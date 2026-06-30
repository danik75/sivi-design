import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCustomer } from '../services/customersApi';

export default function useDeleteCustomer(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation((id) => deleteCustomer(id), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}
