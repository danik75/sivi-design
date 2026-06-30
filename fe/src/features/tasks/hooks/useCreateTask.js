import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '@/features/tasks/services/tasksApi';

export default function useCreateTask(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation(createTask, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
