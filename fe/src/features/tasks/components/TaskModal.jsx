import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import {
  DEFAULT_STATUS,
  STATUS_OPTIONS,
  TASK_TEXT,
  getApiErrorMessage,
} from '@/features/tasks/constants';
import useCreateTask from '@/features/tasks/hooks/useCreateTask';
import useCustomersLookup from '@/features/tasks/hooks/useCustomersLookup';
import useUpdateTask from '@/features/tasks/hooks/useUpdateTask';

const FORM_ID = 'task-modal-form';

const selectClass =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200';

const textareaClass =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function buildInitialState(task) {
  return {
    name: task?.name ?? '',
    description: task?.description ?? '',
    startDate: task?.startDate ?? '',
    startTime: task?.startTime ?? '',
    endDate: task?.endDate ?? '',
    endTime: task?.endTime ?? '',
    status: task?.status ?? DEFAULT_STATUS,
    customerId: task?.customerId != null ? String(task.customerId) : '',
    estimatedHours: task?.estimatedHours != null ? String(task.estimatedHours) : '',
    percentComplete: task?.percentComplete ?? 0,
  };
}

export default function TaskModal({ isOpen, onClose, task, onSuccess }) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const activeMutation = task ? updateMutation : createMutation;

  const { data: customersData } = useCustomersLookup();
  const customers = customersData?.data ?? [];

  const [fields, setFields] = useState(() => buildInitialState(task));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFields(buildInitialState(task));
    setErrors({});
    setSubmitError('');
    createMutation.reset();
    updateMutation.reset();
  }, [task, isOpen]);

  const set = (field) => (eventOrValue) => {
    const value =
      eventOrValue && eventOrValue.target !== undefined
        ? eventOrValue.target.type === 'checkbox'
          ? eventOrValue.target.checked
          : eventOrValue.target.value
        : eventOrValue;
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const dialogTitle = task ? TASK_TEXT.modal.editTitle : TASK_TEXT.modal.createTitle;
  const submitLabel = task ? TASK_TEXT.modal.editSubmit : TASK_TEXT.modal.createSubmit;
  const isSaving = activeMutation.isLoading || activeMutation.isPending;

  const validate = () => {
    const next = {};
    if (!fields.name.trim()) {
      next.name = TASK_TEXT.modal.nameRequired;
    }
    if (!fields.startDate) {
      next.startDate = TASK_TEXT.modal.startDateRequired;
    }
    if (!fields.endDate) {
      next.endDate = TASK_TEXT.modal.endDateRequired;
    }
    if (fields.startDate && fields.endDate && fields.endDate < fields.startDate) {
      next.endDate = TASK_TEXT.modal.endDateBeforeStart;
    }
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setSubmitError('');
      return;
    }

    setErrors({});
    setSubmitError('');

    const payload = {
      name: fields.name.trim(),
      description: fields.description.trim() || null,
      startDate: fields.startDate,
      startTime: fields.startTime || null,
      endDate: fields.endDate,
      endTime: fields.endTime || null,
      status: fields.status,
      customerId: fields.customerId || null,
      estimatedHours: fields.estimatedHours !== '' ? Number(fields.estimatedHours) : null,
      percentComplete: task ? Number(fields.percentComplete) : 0,
    };

    const onError = (error) => {
      setSubmitError(getApiErrorMessage(error, TASK_TEXT.modal.saveError));
    };

    const mutationOptions = {
      onSuccess: (savedTask) => {
        onSuccess(
          task
            ? TASK_TEXT.success.updated(savedTask?.name ?? fields.name.trim())
            : TASK_TEXT.success.created(savedTask?.name ?? fields.name.trim())
        );
        onClose();
      },
      onError,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, data: payload }, mutationOptions);
      return;
    }

    createMutation.mutate(payload, mutationOptions);
  };

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {TASK_TEXT.modal.cancel}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {submitLabel}
        </Button>
      </>
    ),
    [isSaving, onClose, submitLabel]
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle} footer={footer}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <FormField label={TASK_TEXT.modal.nameLabel}>
            <Input
              value={fields.name}
              onChange={set('name')}
              placeholder={TASK_TEXT.modal.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-xs font-medium text-rose-600">{errors.name}</p>
            ) : null}
          </FormField>

          {/* Description */}
          <FormField label={TASK_TEXT.modal.descriptionLabel}>
            <textarea
              className={textareaClass}
              rows={2}
              value={fields.description}
              onChange={set('description')}
              placeholder={TASK_TEXT.modal.descriptionPlaceholder}
            />
          </FormField>

          {/* Start date + time */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={TASK_TEXT.modal.startDateLabel}>
              <Input
                type="date"
                value={fields.startDate}
                onChange={set('startDate')}
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate ? (
                <p className="text-xs font-medium text-rose-600">{errors.startDate}</p>
              ) : null}
            </FormField>
            <FormField label={TASK_TEXT.modal.startTimeLabel}>
              <Input
                type="time"
                value={fields.startTime}
                onChange={set('startTime')}
                placeholder={TASK_TEXT.modal.startTimePlaceholder}
              />
            </FormField>
          </div>

          {/* End date + time */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={TASK_TEXT.modal.endDateLabel}>
              <Input
                type="date"
                value={fields.endDate}
                onChange={set('endDate')}
                aria-invalid={Boolean(errors.endDate)}
              />
              {errors.endDate ? (
                <p className="text-xs font-medium text-rose-600">{errors.endDate}</p>
              ) : null}
            </FormField>
            <FormField label={TASK_TEXT.modal.endTimeLabel}>
              <Input
                type="time"
                value={fields.endTime}
                onChange={set('endTime')}
                placeholder={TASK_TEXT.modal.endTimePlaceholder}
              />
            </FormField>
          </div>

          {/* Status */}
          <FormField label={TASK_TEXT.modal.statusLabel}>
            <select className={selectClass} value={fields.status} onChange={set('status')}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* Customer */}
          <FormField label={TASK_TEXT.modal.customerLabel}>
            <select className={selectClass} value={fields.customerId} onChange={set('customerId')}>
              <option value="">{TASK_TEXT.modal.noCustomer}</option>
              {customers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          {/* Estimated hours */}
          <FormField label={TASK_TEXT.modal.estimatedHoursLabel}>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={fields.estimatedHours}
              onChange={set('estimatedHours')}
              placeholder={TASK_TEXT.modal.estimatedHoursPlaceholder}
            />
          </FormField>

          {/* % Complete — edit mode only */}
          {task ? (
            <FormField label={TASK_TEXT.modal.percentCompleteLabel}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={fields.percentComplete}
                  onChange={set('percentComplete')}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-10 text-right text-sm font-semibold text-slate-700">
                  {fields.percentComplete}%
                </span>
              </div>
            </FormField>
          ) : null}

          {submitError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {submitError}
            </p>
          ) : null}
        </Form>
      </div>
    </Dialog>
  );
}

TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    startTime: PropTypes.string,
    endDate: PropTypes.string,
    endTime: PropTypes.string,
    status: PropTypes.string,
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    estimatedHours: PropTypes.number,
    percentComplete: PropTypes.number,
  }),
  onSuccess: PropTypes.func.isRequired,
};
