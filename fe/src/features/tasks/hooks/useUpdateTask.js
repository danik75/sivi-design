import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/features/tasks/services/tasksApi';

export default function useUpdateTask(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation(({ id, data }) => updateTask(id, data), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
