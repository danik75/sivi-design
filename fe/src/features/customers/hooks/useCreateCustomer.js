import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomer } from '../services/customersApi';

export default function useCreateCustomer(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation(createCustomer, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}
