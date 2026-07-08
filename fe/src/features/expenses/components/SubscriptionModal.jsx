import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Dialog from '@/components/chadcn/Dialog';
import Dropdown from '@/components/chadcn/Dropdown';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import useCustomers from '@/features/customers/hooks/useCustomers';
import { CURRENCIES, EXPENSE_CATEGORIES, getApiErrorMessage } from '@/features/expenses/constants';
import {
  useCreateSubscription,
  useUpdateSubscription,
} from '@/features/expenses/hooks/useSubscriptions';

const FORM_ID = 'subscription-modal-form';

function initialState(sub) {
  return {
    name: sub?.name ?? '',
    startDate: sub?.startDate ?? '',
    monthlyAmount: sub?.monthlyAmount != null ? String(sub.monthlyAmount) : '',
    currency: sub?.currency ?? 'NIS',
    renewalDay: sub?.renewalDay != null ? String(sub.renewalDay) : '',
    category: sub?.category ?? '',
    customerId: sub?.customerId ? String(sub.customerId) : '',
    description: sub?.description ?? '',
  };
}

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export default function SubscriptionModal({ isOpen, onClose, subscription, onSuccess }) {
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const activeMutation = subscription ? updateMutation : createMutation;
  const isSaving = activeMutation.isLoading || activeMutation.isPending;

  const { data: customersData } = useCustomers({ limit: 10000 });
  const customers = customersData?.data ?? [];

  const [fields, setFields] = useState(() => initialState(subscription));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFields(initialState(subscription));
    setErrors({});
    setSubmitError('');
    createMutation.reset();
    updateMutation.reset();
  }, [isOpen, subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (value) => {
    setFields((cur) => ({ ...cur, [field]: value?.target ? value.target.value : value }));
    setErrors((cur) => (cur[field] ? { ...cur, [field]: '' } : cur));
  };

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {subscription ? 'Save Changes' : 'Add Subscription'}
        </Button>
      </>
    ),
    [isSaving, onClose, subscription]
  );

  const validate = () => {
    const next = {};
    if (!fields.name.trim()) next.name = 'Name is required.';
    if (!fields.startDate) next.startDate = 'Start date is required.';
    const amt = Number(fields.monthlyAmount);
    if (!fields.monthlyAmount || Number.isNaN(amt) || amt <= 0)
      next.monthlyAmount = 'Monthly payment must be greater than 0.';
    const day = Number(fields.renewalDay);
    if (!fields.renewalDay || !Number.isInteger(day) || day < 1 || day > 31)
      next.renewalDay = 'Renewal day must be 1–31.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload = {
      name: fields.name.trim(),
      startDate: fields.startDate,
      monthlyAmount: Number(fields.monthlyAmount),
      currency: fields.currency,
      renewalDay: Number(fields.renewalDay),
      category: fields.category || undefined,
      customerId: fields.customerId || undefined,
      description: fields.description.trim() || undefined,
    };

    const options = {
      onSuccess: () => {
        onSuccess(
          subscription ? `${payload.name} updated.` : `${payload.name} added.`
        );
        onClose();
      },
      onError: (error) =>
        setSubmitError(getApiErrorMessage(error, 'Unable to save subscription.')),
    };

    if (subscription) {
      updateMutation.mutate({ id: subscription.id, ...payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? 'Edit Subscription' : 'Add Subscription'}
      footer={footer}
    >
      <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <Input value={fields.name} onChange={set('name')} placeholder="Figma, Adobe CC…" />
          {errors.name ? <p className="text-xs font-medium text-rose-600">{errors.name}</p> : null}
        </FormField>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Monthly payment">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fields.monthlyAmount}
              onChange={set('monthlyAmount')}
              placeholder="45.00"
            />
            {errors.monthlyAmount ? (
              <p className="text-xs font-medium text-rose-600">{errors.monthlyAmount}</p>
            ) : null}
          </FormField>
          <FormField label="Currency">
            <Dropdown
              value={fields.currency}
              onChange={set('currency')}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </FormField>
          <FormField label="Renewal day">
            <Dropdown
              value={fields.renewalDay}
              onChange={set('renewalDay')}
              placeholder="Day"
              options={DAY_OPTIONS}
            />
            {errors.renewalDay ? (
              <p className="text-xs font-medium text-rose-600">{errors.renewalDay}</p>
            ) : null}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Start date">
            <DatePicker value={fields.startDate} onChange={set('startDate')} placeholder="Select date" />
            {errors.startDate ? (
              <p className="text-xs font-medium text-rose-600">{errors.startDate}</p>
            ) : null}
          </FormField>
          <FormField label="Category">
            <Dropdown
              value={fields.category}
              onChange={set('category')}
              placeholder="Optional"
              options={[{ value: '', label: 'None' }, ...EXPENSE_CATEGORIES]}
            />
          </FormField>
        </div>

        <FormField label="Customer">
          <Dropdown
            value={fields.customerId}
            onChange={set('customerId')}
            options={[
              { value: '', label: 'No customer' },
              ...customers.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        </FormField>

        <FormField label="Description">
          <Input value={fields.description} onChange={set('description')} placeholder="Optional notes" />
        </FormField>

        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {submitError}
          </p>
        ) : null}
      </Form>
    </Dialog>
  );
}

SubscriptionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  subscription: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};
