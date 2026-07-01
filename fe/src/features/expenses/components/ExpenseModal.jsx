import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import Select from '@/components/chadcn/Select';
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  EXPENSE_TEXT,
  getApiErrorMessage,
} from '@/features/expenses/constants';
import useCreateExpense from '@/features/expenses/hooks/useCreateExpense';
import useCustomers from '@/features/customers/hooks/useCustomers';

const FORM_ID = 'expense-modal-form';
const TEXTAREA_CLASS_NAME =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function createInitialState() {
  return {
    vendor: '',
    category: '',
    amount: '',
    currency: 'NIS',
    date: '',
    customerId: '',
    description: '',
  };
}

function buildPayload(formState) {
  return {
    vendor: formState.vendor.trim(),
    category: formState.category,
    amount: parseFloat(formState.amount),
    currency: formState.currency,
    date: formState.date,
    customerId: formState.customerId || undefined,
    description: formState.description.trim() || undefined,
  };
}

export default function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const createMutation = useCreateExpense();
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({
    limit: 10000,
  });
  const customers = customersData?.data ?? [];
  const [formState, setFormState] = useState(createInitialState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const isSaving = createMutation.isLoading || createMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setFormState(createInitialState());
      setErrors({});
      setSubmitError('');
      createMutation.reset();
      return;
    }

    setFormState(createInitialState());
    setErrors({});
    setSubmitError('');
  }, [isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {EXPENSE_TEXT.modal.cancel}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {EXPENSE_TEXT.modal.submit}
        </Button>
      </>
    ),
    [isSaving, onClose]
  );

  const handleChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedVendor = formState.vendor.trim();
    const numericAmount = Number(formState.amount);

    if (!trimmedVendor) {
      nextErrors.vendor = EXPENSE_TEXT.modal.vendorRequired;
    }

    if (!formState.category) {
      nextErrors.category = EXPENSE_TEXT.modal.categoryRequired;
    }

    if (!formState.amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = EXPENSE_TEXT.modal.amountRequired;
    }

    if (!formState.date) {
      nextErrors.date = EXPENSE_TEXT.modal.dateRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    const payload = buildPayload(formState);

    createMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess(EXPENSE_TEXT.success.created(payload.vendor));
        onClose();
      },
      onError: (error) => {
        setSubmitError(getApiErrorMessage(error, EXPENSE_TEXT.modal.saveError));
      },
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={EXPENSE_TEXT.modal.title} footer={footer}>
      <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        <FormField label={EXPENSE_TEXT.modal.vendorLabel}>
          <Input
            type="text"
            value={formState.vendor}
            onChange={(event) => handleChange('vendor', event.target.value)}
            placeholder={EXPENSE_TEXT.modal.vendorPlaceholder}
            aria-invalid={Boolean(errors.vendor)}
          />
          {errors.vendor ? (
            <p className="text-xs font-medium text-rose-600">{errors.vendor}</p>
          ) : null}
        </FormField>

        <FormField label={EXPENSE_TEXT.modal.categoryLabel}>
          <Select
            value={formState.category}
            onChange={(event) => handleChange('category', event.target.value)}
            aria-invalid={Boolean(errors.category)}
          >
            <option value="">{EXPENSE_TEXT.modal.typePlaceholder}</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
          {errors.category ? (
            <p className="text-xs font-medium text-rose-600">{errors.category}</p>
          ) : null}
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={EXPENSE_TEXT.modal.amountLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.amount}
              onChange={(event) => handleChange('amount', event.target.value)}
              placeholder={EXPENSE_TEXT.modal.amountPlaceholder}
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount ? (
              <p className="text-xs font-medium text-rose-600">{errors.amount}</p>
            ) : null}
          </FormField>

          <FormField label={EXPENSE_TEXT.modal.currencyLabel}>
            <Select
              value={formState.currency}
              onChange={(event) => handleChange('currency', event.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label={EXPENSE_TEXT.modal.dateLabel}>
          <DatePicker
            value={formState.date}
            onChange={(value) => handleChange('date', value)}
            placeholder={EXPENSE_TEXT.modal.datePlaceholder}
          />
          {errors.date ? <p className="text-xs font-medium text-rose-600">{errors.date}</p> : null}
        </FormField>

        <FormField label={EXPENSE_TEXT.modal.customerLabel}>
          <Select
            value={formState.customerId}
            onChange={(event) => handleChange('customerId', event.target.value)}
          >
            <option value="">{EXPENSE_TEXT.modal.customerPlaceholder}</option>
            {isCustomersLoading ? (
              <option value="" disabled>
                {EXPENSE_TEXT.filters.customerLoading}
              </option>
            ) : null}
            {isCustomersError ? (
              <option value="" disabled>
                {EXPENSE_TEXT.filters.customerError}
              </option>
            ) : null}
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label={EXPENSE_TEXT.modal.descriptionLabel}>
          <textarea
            className={TEXTAREA_CLASS_NAME}
            rows={3}
            value={formState.description}
            onChange={(event) => handleChange('description', event.target.value)}
            placeholder={EXPENSE_TEXT.modal.descriptionPlaceholder}
          />
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

ExpenseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
