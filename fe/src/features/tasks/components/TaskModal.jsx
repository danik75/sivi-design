import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Dialog from '@/components/chadcn/Dialog';
import Dropdown from '@/components/chadcn/Dropdown';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import useContracts from '@/features/contracts/hooks/useContracts';
import { getContractUsage } from '@/features/contracts/services/contractsApi';
import { CONTRACT_TYPE_LABEL, contractOptionLabel } from '@/features/tasks/contractLabel';
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

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const todayDateStr = () => toDateStr(new Date());
const weekFromTodayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDateStr(d);
};

const PRESET_COLORS = [
  '#64748b',
  '#6366f1',
  '#22c55e',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#14b8a6',
  '#8b5cf6',
  '#ec4899',
  '#0ea5e9',
  '#a16207',
  '#dc2626',
];

const textareaClass =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function normDate(val) {
  if (!val) return null;
  const s = String(val);
  if (!s.includes('T')) return s;
  // ISO datetime — extract local date to avoid UTC off-by-one in non-UTC timezones
  const dt = new Date(s);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function normTime(val) {
  if (!val) return '00:00';
  return String(val).slice(0, 5);
}

function buildInitialState(task) {
  return {
    name: task?.name ?? '',
    description: task?.description ?? '',
    startDate: normDate(task?.startDate) ?? todayDateStr(),
    startTime: normTime(task?.startTime),
    endDate: normDate(task?.endDate) ?? weekFromTodayStr(),
    endTime: normTime(task?.endTime),
    status: task?.status ?? DEFAULT_STATUS,
    customerId: task?.customerId != null ? String(task.customerId) : '',
    contractId: task?.contractId != null ? String(task.contractId) : '',
    estimatedHours: task?.estimatedHours != null ? String(task.estimatedHours) : '',
    percentComplete: task?.percentComplete ?? 0,
    color: task?.color ?? '',
  };
}

function PrepaidRemaining({ usage, estimate }) {
  const purchased = Number(usage.hoursPurchased) || 0;
  const used = Number(usage.hoursUsed) || 0;
  const remaining = Number(usage.hoursRemaining);
  const projected = remaining - (estimate || 0);
  const pct = purchased > 0 ? Math.min(100, (used / purchased) * 100) : 0;
  const over = projected < 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
      <div className="flex justify-between text-slate-600">
        <span>Prepaid hours</span>
        <span className={over ? 'font-semibold text-rose-600' : 'font-semibold text-slate-800'}>
          {remaining}h of {purchased}h remaining
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${over ? 'bg-rose-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {estimate > 0 ? (
        <p className={`mt-1 ${over ? 'text-rose-600' : 'text-slate-400'}`}>
          {over
            ? `This estimate (${estimate}h) exceeds the remaining hours by ${Math.abs(projected)}h.`
            : `After this estimate (${estimate}h): ${projected}h left.`}
        </p>
      ) : null}
    </div>
  );
}

PrepaidRemaining.propTypes = {
  usage: PropTypes.object.isRequired,
  estimate: PropTypes.number,
};

export default function TaskModal({ isOpen, onClose, task, onSuccess, onComplete }) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const activeMutation = task ? updateMutation : createMutation;

  const { data: customersData } = useCustomersLookup();
  const customers = customersData?.data ?? [];

  const [fields, setFields] = useState(() => buildInitialState(task));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [spillover, setSpillover] = useState(null); // { payload, remaining, purchased, estimate }

  // Active contracts for the selected customer (+ keep the already-linked one).
  const { data: contractsData } = useContracts({
    customerId: fields.customerId || undefined,
    status: 'active',
  });
  const activeContracts = contractsData?.data ?? contractsData ?? [];
  const selectedContract = activeContracts.find((c) => String(c.id) === String(fields.contractId));
  const isPrepaid = selectedContract?.type === 'prepaid_hours';

  // Prepaid burndown for the selected contract (excluding this task's own hours).
  const { data: usage } = useQuery(
    ['contract-usage', fields.contractId, task?.id],
    () => getContractUsage(fields.contractId, task?.id),
    { enabled: isOpen && isPrepaid && Boolean(fields.contractId) }
  );

  const contractOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'No contract' },
      ...activeContracts.map((c) => ({ value: String(c.id), label: contractOptionLabel(c) })),
    ];
    // Keep the already-linked contract visible even if it's no longer active.
    if (fields.contractId && !opts.some((o) => o.value === String(fields.contractId))) {
      opts.push({
        value: String(fields.contractId),
        label: task?.contractType ? CONTRACT_TYPE_LABEL[task.contractType] ?? 'Contract' : 'Contract',
      });
    }
    return opts;
  }, [activeContracts, fields.contractId, task]);

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
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      // Changing the customer clears the contract (contracts are customer-scoped).
      if (field === 'customerId' && value !== prev.customerId) {
        next.contractId = '';
      }
      // Auto-set times when start === end date
      if (field === 'startDate' || field === 'endDate') {
        const s = field === 'startDate' ? value : prev.startDate;
        const e = field === 'endDate' ? value : prev.endDate;
        if (s && e && s === e) {
          // Same-day task defaults to a working day (08:00–21:00).
          next.startTime = '08:00';
          next.endTime = '21:00';
        }
      }
      // Auto-set status from percentComplete (skip if cancelled)
      if (field === 'percentComplete' && prev.status !== 'cancelled') {
        const pct = Number(value);
        if (pct === 0) next.status = 'pending';
        else if (pct === 100) next.status = 'done';
        else next.status = 'in_progress';
      }
      // Auto-set percentComplete to 100 when status set to done
      if (field === 'status' && value === 'done') {
        next.percentComplete = 100;
      }
      return next;
    });
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
    // Completing a task requires actual hours (edit mode only)
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
      contractId: fields.contractId || null,
      estimatedHours: fields.estimatedHours !== '' ? Number(fields.estimatedHours) : null,
      percentComplete: task ? Number(fields.percentComplete) : 0,
      color: fields.color || null,
    };

    // Prepaid-hours spillover: if this task's estimate would exceed the hours the
    // customer prepaid on the selected contract, warn before saving.
    const est = payload.estimatedHours ?? 0;
    if (isPrepaid && usage && usage.hoursRemaining != null && est > usage.hoursRemaining) {
      setSpillover({ payload, remaining: usage.hoursRemaining, purchased: usage.hoursPurchased, estimate: est });
      return;
    }

    proceed(payload);
  };

  const proceed = (payload) => {
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
      // Moving to "done": persist the edits (incl. estimated hours) with status
      // done — the payload has no actualHours key, so actual time is untouched —
      // then open the completion popup to capture actual hours.
      if (fields.status === 'done' && onComplete) {
        updateMutation.mutate(
          { id: task.id, data: payload },
          {
            onSuccess: (saved) => {
              onComplete(saved ?? { ...task, ...payload });
              onClose();
            },
            onError,
          },
        );
        return;
      }
      // Any non-done status zeroes actual hours (no actual time logged).
      payload.actualHours = null;
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
    <>
    <Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle} footer={footer} size="2xl">
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          {/* Linked invoice (read-only) */}
          {task?.invoiceNumber ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              On invoice <span className="font-semibold text-slate-800">{task.invoiceNumber}</span>.
              Unrelate it from the invoice to abort this task.
            </div>
          ) : null}

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

          {/* Dates + status */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label={TASK_TEXT.modal.startDateLabel}>
              <DatePicker value={fields.startDate} onChange={(v) => set('startDate')(v)} />
              {errors.startDate ? (
                <p className="text-xs font-medium text-rose-600">{errors.startDate}</p>
              ) : null}
            </FormField>
            <FormField label={TASK_TEXT.modal.endDateLabel}>
              <DatePicker value={fields.endDate} onChange={(v) => set('endDate')(v)} />
              {errors.endDate ? (
                <p className="text-xs font-medium text-rose-600">{errors.endDate}</p>
              ) : null}
            </FormField>
            <FormField label={TASK_TEXT.modal.statusLabel}>
              <Dropdown value={fields.status} onChange={set('status')} options={STATUS_OPTIONS} />
            </FormField>
          </div>

          {/* Times + customer */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label={TASK_TEXT.modal.startTimeLabel}>
              <Input
                type="time"
                value={fields.startTime}
                onChange={set('startTime')}
                placeholder={TASK_TEXT.modal.startTimePlaceholder}
              />
            </FormField>
            <FormField label={TASK_TEXT.modal.endTimeLabel}>
              <Input
                type="time"
                value={fields.endTime}
                onChange={set('endTime')}
                placeholder={TASK_TEXT.modal.endTimePlaceholder}
              />
            </FormField>
            <FormField label={TASK_TEXT.modal.customerLabel}>
              <Dropdown
                value={fields.customerId}
                onChange={set('customerId')}
                options={[
                  { value: '', label: TASK_TEXT.modal.noCustomer },
                  ...customers.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />
            </FormField>
          </div>

          {/* Contract + estimated hours */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Contract" className="col-span-2">
              <Dropdown
                value={fields.contractId}
                onChange={set('contractId')}
                options={contractOptions}
                placeholder={fields.customerId ? 'No contract' : 'Select a customer first'}
              />
            </FormField>
            <FormField label={TASK_TEXT.modal.estimatedHoursLabel}>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={fields.estimatedHours}
                onChange={set('estimatedHours')}
                placeholder={TASK_TEXT.modal.estimatedHoursPlaceholder}
              />
            </FormField>
          </div>

          {/* Prepaid-hours remaining */}
          {isPrepaid && usage && usage.hoursPurchased != null ? (
            <PrepaidRemaining usage={usage} estimate={Number(fields.estimatedHours) || 0} />
          ) : null}

          {/* Task color */}
          <FormField label="Task Color">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => set('color')(fields.color === hex ? '' : hex)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                  style={{
                    backgroundColor: hex,
                    borderColor: fields.color === hex ? '#1e293b' : 'transparent',
                  }}
                  title={hex}
                />
              ))}
              {fields.color ? (
                <button
                  type="button"
                  onClick={() => set('color')('')}
                  className="h-7 rounded px-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {fields.color ? (
              <p className="mt-1 text-xs text-slate-400">Selected: {fields.color}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No color — status color will be used.</p>
            )}
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

      <Dialog
        isOpen={Boolean(spillover)}
        onClose={() => setSpillover(null)}
        title="Prepaid hours exhausted"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setSpillover(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const pending = spillover;
                setSpillover(null);
                proceed(pending.payload);
              }}
            >
              Save anyway
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This task&apos;s estimate ({spillover?.estimate}h) exceeds the hours the customer prepaid on
          this contract ({spillover?.purchased}h purchased, {spillover?.remaining}h remaining). The
          prepaid block will be exhausted. Save anyway?
        </p>
      </Dialog>
    </>
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
    color: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
};
