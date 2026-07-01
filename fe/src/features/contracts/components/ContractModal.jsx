import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import Select from '@/components/chadcn/Select';
import { CONTRACT_TEXT, CONTRACT_TYPES, getApiErrorMessage } from '@/features/contracts/constants';
import useCreateContract from '@/features/contracts/hooks/useCreateContract';
import useCustomers from '@/features/customers/hooks/useCustomers';

const FORM_ID = 'contract-modal-form';
const TEXTAREA_CLASS_NAME =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

const CURRENCIES = ['NIS', 'USD'];

function createInitialState() {
  return {
    customerId: '',
    type: '',
    description: '',
    expiresAt: '',
    totalAmount: '',
    hourlyRate: '',
    hoursPurchased: '',
    amountPaid: '',
    monthlyFee: '',
    hoursPerMonth: '',
    currency: 'NIS',
  };
}

function buildPayload(formState) {
  const basePayload = {
    customerId: formState.customerId,
    type: formState.type,
    description: formState.description.trim(),
    expiresAt: formState.expiresAt || null,
  };

  if (formState.type === 'lump_sum') {
    return {
      ...basePayload,
      totalAmount: parseFloat(formState.totalAmount),
      currency: formState.currency,
    };
  }

  if (formState.type === 'time_and_materials') {
    return {
      ...basePayload,
      hourlyRate: parseFloat(formState.hourlyRate),
      currency: formState.currency,
    };
  }

  if (formState.type === 'prepaid_hours') {
    return {
      ...basePayload,
      hoursPurchased: parseFloat(formState.hoursPurchased),
      amountPaid: parseFloat(formState.amountPaid),
      currency: formState.currency,
    };
  }

  if (formState.type === 'monthly_retainer') {
    return {
      ...basePayload,
      monthlyFee: parseFloat(formState.monthlyFee),
      hoursPerMonth: parseFloat(formState.hoursPerMonth),
      currency: formState.currency,
    };
  }

  return basePayload;
}

export default function ContractModal({ isOpen, onClose, onSuccess }) {
  const createMutation = useCreateContract();
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
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {CONTRACT_TEXT.modal.cancel}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {CONTRACT_TEXT.modal.submit}
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

    if (!formState.customerId) {
      nextErrors.customerId = CONTRACT_TEXT.modal.customerRequired;
    }

    if (!formState.type) {
      nextErrors.type = CONTRACT_TEXT.modal.typeRequired;
    }

    if (formState.type === 'lump_sum' && !formState.totalAmount) {
      nextErrors.totalAmount = CONTRACT_TEXT.modal.totalAmountRequired;
    }

    if (formState.type === 'time_and_materials' && !formState.hourlyRate) {
      nextErrors.hourlyRate = CONTRACT_TEXT.modal.hourlyRateRequired;
    }

    if (formState.type === 'prepaid_hours' && !formState.hoursPurchased) {
      nextErrors.hoursPurchased = CONTRACT_TEXT.modal.hoursPurchasedRequired;
    }

    if (formState.type === 'prepaid_hours' && !formState.amountPaid) {
      nextErrors.amountPaid = CONTRACT_TEXT.modal.amountPaidRequired;
    }

    if (formState.type === 'monthly_retainer' && !formState.monthlyFee) {
      nextErrors.monthlyFee = CONTRACT_TEXT.modal.monthlyFeeRequired;
    }

    if (formState.type === 'monthly_retainer' && !formState.hoursPerMonth) {
      nextErrors.hoursPerMonth = CONTRACT_TEXT.modal.hoursPerMonthRequired;
    }

    if (
      ['lump_sum', 'time_and_materials', 'prepaid_hours', 'monthly_retainer'].includes(
        formState.type
      ) &&
      !formState.currency
    ) {
      nextErrors.currency = CONTRACT_TEXT.modal.currencyRequired;
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
      onSuccess: (savedContract) => {
        onSuccess(CONTRACT_TEXT.success.created(savedContract?.name || CONTRACT_TEXT.title));
        onClose();
      },
      onError: (error) => {
        setSubmitError(getApiErrorMessage(error, CONTRACT_TEXT.modal.saveError));
      },
    });
  };

  const renderTypeFields = () => {
    if (formState.type === 'lump_sum') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={CONTRACT_TEXT.modal.totalAmountLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.totalAmount}
              onChange={(event) => handleChange('totalAmount', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.totalAmountPlaceholder}
              aria-invalid={Boolean(errors.totalAmount)}
            />
            {errors.totalAmount ? (
              <p className="text-xs font-medium text-rose-600">{errors.totalAmount}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.currencyLabel}>
            <Select
              value={formState.currency}
              onChange={(event) => handleChange('currency', event.target.value)}
              aria-invalid={Boolean(errors.currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.currency ? (
              <p className="text-xs font-medium text-rose-600">{errors.currency}</p>
            ) : null}
          </FormField>
        </div>
      );
    }

    if (formState.type === 'time_and_materials') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={CONTRACT_TEXT.modal.hourlyRateLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.hourlyRate}
              onChange={(event) => handleChange('hourlyRate', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.hourlyRatePlaceholder}
              aria-invalid={Boolean(errors.hourlyRate)}
            />
            {errors.hourlyRate ? (
              <p className="text-xs font-medium text-rose-600">{errors.hourlyRate}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.currencyLabel}>
            <Select
              value={formState.currency}
              onChange={(event) => handleChange('currency', event.target.value)}
              aria-invalid={Boolean(errors.currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.currency ? (
              <p className="text-xs font-medium text-rose-600">{errors.currency}</p>
            ) : null}
          </FormField>
        </div>
      );
    }

    if (formState.type === 'prepaid_hours') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={CONTRACT_TEXT.modal.hoursPurchasedLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.hoursPurchased}
              onChange={(event) => handleChange('hoursPurchased', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.hoursPurchasedPlaceholder}
              aria-invalid={Boolean(errors.hoursPurchased)}
            />
            {errors.hoursPurchased ? (
              <p className="text-xs font-medium text-rose-600">{errors.hoursPurchased}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.amountPaidLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.amountPaid}
              onChange={(event) => handleChange('amountPaid', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.amountPaidPlaceholder}
              aria-invalid={Boolean(errors.amountPaid)}
            />
            {errors.amountPaid ? (
              <p className="text-xs font-medium text-rose-600">{errors.amountPaid}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.currencyLabel} className="md:col-span-2">
            <Select
              value={formState.currency}
              onChange={(event) => handleChange('currency', event.target.value)}
              aria-invalid={Boolean(errors.currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.currency ? (
              <p className="text-xs font-medium text-rose-600">{errors.currency}</p>
            ) : null}
          </FormField>
        </div>
      );
    }

    if (formState.type === 'monthly_retainer') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={CONTRACT_TEXT.modal.monthlyFeeLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.monthlyFee}
              onChange={(event) => handleChange('monthlyFee', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.monthlyFeePlaceholder}
              aria-invalid={Boolean(errors.monthlyFee)}
            />
            {errors.monthlyFee ? (
              <p className="text-xs font-medium text-rose-600">{errors.monthlyFee}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.hoursPerMonthLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.hoursPerMonth}
              onChange={(event) => handleChange('hoursPerMonth', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.hoursPerMonthPlaceholder}
              aria-invalid={Boolean(errors.hoursPerMonth)}
            />
            {errors.hoursPerMonth ? (
              <p className="text-xs font-medium text-rose-600">{errors.hoursPerMonth}</p>
            ) : null}
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.currencyLabel} className="md:col-span-2">
            <Select
              value={formState.currency}
              onChange={(event) => handleChange('currency', event.target.value)}
              aria-invalid={Boolean(errors.currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.currency ? (
              <p className="text-xs font-medium text-rose-600">{errors.currency}</p>
            ) : null}
          </FormField>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={CONTRACT_TEXT.modal.title} footer={footer}>
      <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {CONTRACT_TEXT.modal.commonSectionTitle}
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={CONTRACT_TEXT.modal.customerLabel}>
              <Select
                value={formState.customerId}
                onChange={(event) => handleChange('customerId', event.target.value)}
                aria-invalid={Boolean(errors.customerId)}
              >
                <option value="">{CONTRACT_TEXT.modal.customerPlaceholder}</option>
                {isCustomersLoading ? (
                  <option value="" disabled>
                    {CONTRACT_TEXT.filters.customerLoading}
                  </option>
                ) : null}
                {isCustomersError ? (
                  <option value="" disabled>
                    {CONTRACT_TEXT.filters.customerError}
                  </option>
                ) : null}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
              {errors.customerId ? (
                <p className="text-xs font-medium text-rose-600">{errors.customerId}</p>
              ) : null}
            </FormField>
            <FormField label={CONTRACT_TEXT.modal.typeLabel}>
              <Select
                value={formState.type}
                onChange={(event) => handleChange('type', event.target.value)}
                aria-invalid={Boolean(errors.type)}
              >
                <option value="">{CONTRACT_TEXT.modal.typePlaceholder}</option>
                {CONTRACT_TYPES.map((contractType) => (
                  <option key={contractType.value} value={contractType.value}>
                    {contractType.label}
                  </option>
                ))}
              </Select>
              {errors.type ? (
                <p className="text-xs font-medium text-rose-600">{errors.type}</p>
              ) : null}
            </FormField>
          </div>
          <FormField label={CONTRACT_TEXT.modal.descriptionLabel}>
            <textarea
              className={TEXTAREA_CLASS_NAME}
              rows={3}
              value={formState.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder={CONTRACT_TEXT.modal.descriptionPlaceholder}
            />
          </FormField>
          <FormField label={CONTRACT_TEXT.modal.expirationLabel}>
            <DatePicker
              value={formState.expiresAt}
              onChange={(value) => handleChange('expiresAt', value)}
              placeholder={CONTRACT_TEXT.modal.expirationPlaceholder}
            />
          </FormField>
        </div>

        {formState.type ? (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {CONTRACT_TEXT.modal.typeSectionTitle}
              </h3>
            </div>
            {renderTypeFields()}
          </div>
        ) : null}

        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {submitError}
          </p>
        ) : null}
      </Form>
    </Dialog>
  );
}

ContractModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
