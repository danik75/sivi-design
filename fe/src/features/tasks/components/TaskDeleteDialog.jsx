import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import { TASK_TEXT, getApiErrorMessage } from '@/features/tasks/constants';
import useDeleteTask from '@/features/tasks/hooks/useDeleteTask';

export default function TaskDeleteDialog({ isOpen, onClose, task, onSuccess }) {
  const deleteMutation = useDeleteTask();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeleting = deleteMutation.isLoading || deleteMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deleteMutation.reset();
    }
  }, [isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {TASK_TEXT.deleteDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            if (!task?.id) {
              return;
            }

            setErrorMessage('');
            deleteMutation.mutate(task.id, {
              onSuccess: () => {
                onSuccess(TASK_TEXT.success.deleted(task.name));
                onClose();
              },
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, TASK_TEXT.deleteDialog.error)),
            });
          }}
          disabled={isDeleting || !task?.id}
        >
          {TASK_TEXT.deleteDialog.confirm}
        </Button>
      </>
    ),
    [task, deleteMutation, isDeleting, onClose, onSuccess]
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={TASK_TEXT.deleteDialog.title} footer={footer}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {TASK_TEXT.deleteDialog.description(task?.name ?? '')}
        </p>
        {errorMessage ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

TaskDeleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};
