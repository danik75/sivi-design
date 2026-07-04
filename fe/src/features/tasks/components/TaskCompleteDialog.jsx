import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import { TASK_TEXT, getApiErrorMessage } from '@/features/tasks/constants';
import useUpdateTask from '@/features/tasks/hooks/useUpdateTask';

const T = TASK_TEXT.complete;

// Values come back from the DB as strings ("6.00"); normalise for display.
function numOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// Pre-fill actual hours with any existing value, otherwise the estimate.
function initialHours(task) {
  const actual = numOrNull(task?.actualHours);
  if (actual != null) return String(actual);
  const est = numOrNull(task?.estimatedHours);
  return est != null ? String(est) : '';
}

export default function TaskCompleteDialog({ isOpen, onClose, task, onSuccess }) {
  const updateMutation = useUpdateTask();
  const [actualHours, setActualHours] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const isSaving = updateMutation.isLoading || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setActualHours(initialHours(task));
      setErrorMessage('');
      updateMutation.reset();
    }
  }, [isOpen, task?.id]);

  const estimate = numOrNull(task?.estimatedHours);
  const hoursNum = Number(actualHours);
  const isValid = actualHours !== '' && !Number.isNaN(hoursNum) && hoursNum >= 0;

  const handleConfirm = () => {
    if (!task?.id) return;
    if (!isValid) {
      setErrorMessage(T.required);
      return;
    }
    setErrorMessage('');
    // Only touch status + actual hours — never estimated or other fields, so
    // completion can't accidentally clear existing data.
    updateMutation.mutate(
      { id: task.id, data: { status: 'done', actualHours: hoursNum } },
      {
        onSuccess: () => {
          onSuccess(T.success(task.name));
          onClose();
        },
        onError: (error) => setErrorMessage(getApiErrorMessage(error, T.error)),
      },
    );
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose}>
        {T.cancel}
      </Button>
      <Button type="button" onClick={handleConfirm} disabled={isSaving || !task?.id}>
        {T.confirm}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={T.title} footer={footer}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{T.body(task?.name ?? '')}</p>
        <FormField label={`${T.actualHoursLabel} *`}>
          <Input
            type="number"
            min="0"
            step="0.25"
            value={actualHours}
            onChange={(e) => {
              setActualHours(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            autoFocus
          />
        </FormField>
        <p className="text-xs text-slate-400">
          {estimate != null ? T.estimateHint(estimate) : T.noEstimate}
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

TaskCompleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    estimatedHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    actualHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onSuccess: PropTypes.func.isRequired,
};
