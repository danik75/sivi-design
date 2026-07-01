import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateExpense } from '@/features/expenses/services/expensesApi';

export default function useDeactivateExpense() {
  const queryClient = useQueryClient();
  return useMutation(deactivateExpense, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
