import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomer } from '@/features/customers/services/customersApi';

export default function useUpdateCustomer(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation(({ id, data }) => updateCustomer(id, data), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}
