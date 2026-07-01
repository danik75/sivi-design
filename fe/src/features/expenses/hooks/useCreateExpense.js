import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExpense } from '@/features/expenses/services/expensesApi';

export default function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation(createExpense, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
