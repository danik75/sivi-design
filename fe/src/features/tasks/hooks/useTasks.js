import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '@/features/tasks/services/tasksApi';

export default function useTasks({ search, status, customerId, from, to, page, limit = 25 } = {}) {
  return useQuery(
    ['tasks', search, status, customerId, from, to, page],
    () => fetchTasks({ search, status, customerId, from, to, page, limit }),
    { keepPreviousData: true }
  );
}
