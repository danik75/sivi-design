import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask } from '@/features/tasks/services/tasksApi';

export default function useDeleteTask(providedQueryClient) {
  const queryClient = providedQueryClient ?? useQueryClient();

  return useMutation((id) => deleteTask(id), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
