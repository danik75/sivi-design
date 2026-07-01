import { useQuery } from '@tanstack/react-query';
import { getExpenses } from '@/features/expenses/services/expensesApi';

export default function useExpenses({ customerId, status, category } = {}) {
  return useQuery(
    ['expenses', customerId, status, category],
    () => getExpenses({ customerId, status, category }),
    { keepPreviousData: true }
  );
}
