import { useQuery } from '@tanstack/react-query';
import { fetchCustomersLookup } from '@/features/tasks/services/tasksApi';

export default function useCustomersLookup() {
  return useQuery(['customers-lookup'], fetchCustomersLookup, {
    staleTime: 5 * 60 * 1000,
  });
}
