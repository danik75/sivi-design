import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Input from '@/components/chadcn/Input';
import Dropdown from '@/components/chadcn/Dropdown';
import useCustomers from '@/features/customers/hooks/useCustomers';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
  PRICING_MODELS,
} from '@/features/business-proposals/constants';
import useCreateBusinessProposal from '@/features/business-proposals/hooks/useCreateBusinessProposal';

const CURRENCIES = ['NIS', 'USD'];
const M = BUSINESS_PROPOSALS_TEXT.modal;

const TEXTAREA_CLASS =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function createInitialState() {
  return {
    customerId: '',
    businessRequirement: '',
    pricingModel: '',
    estimatedHours: '',
    hourlyRate: '',
    currency: 'NIS',
    paymentDistribution: '',
  };
}

function requiresEstimatedHours(pricingModel) {
  return (
    pricingModel === 'time_and_materials' ||
    pricingModel === 'capped_hours_bundle' ||
    pricingModel === 'monthly_retainer'
  );
}

function requiresHourlyRate(pricingModel) {
  return pricingModel === 'time_and_materials' || pricingModel === 'monthly_retainer';
}

function Field({ label, htmlFor, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default function BusinessProposalModal({ isOpen, onClose, onSuccess }) {
  const createMutation = useCreateBusinessProposal();
  const [formState, setFormState] = useState(createInitialState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({ limit: 10000 });
  const customers = customersData?.data ?? [];
  const isSaving = createMutation.isLoading || createMutation.isPending;

  const needsEstimatedHours = requiresEstimatedHours(formState.pricingModel);
  const needsHourlyRate = requiresHourlyRate(formState.pricingModel);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFormState(createInitialState());
    setErrors({});
    setSubmitError('');
    createMutation.reset();
  }, [isOpen]);

  const setField = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const validate = () => {
    const next = {};
    if (!formState.customerId) {
      next.customerId = M.requiredCustomer;
    }
    if (!formState.businessRequirement.trim()) {
      next.businessRequirement = M.requiredBusinessRequirement;
    }
    if (!formState.pricingModel) {
      next.pricingModel = M.requiredPricingModel;
    }
    if (needsEstimatedHours && Number(formState.estimatedHours) <= 0) {
      next.estimatedHours = M.requiredEstimatedHours;
    }
    if (needsHourlyRate && Number(formState.hourlyRate) <= 0) {
      next.hourlyRate = M.requiredHourlyRate;
    }
    if (!formState.paymentDistribution.trim()) {
      next.paymentDistribution = M.requiredPaymentDistribution;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    setSubmitError('');
    if (!validate()) {
      return;
    }
    createMutation.mutate(
      {
        customerId: formState.customerId,
        businessRequirement: formState.businessRequirement.trim(),
        pricingModel: formState.pricingModel,
        estimatedHours: formState.estimatedHours ? Number(formState.estimatedHours) : undefined,
        hourlyRate: formState.hourlyRate ? Number(formState.hourlyRate) : undefined,
        currency: formState.currency,
        paymentDistribution: formState.paymentDistribution.trim(),
        requestedLanguage: 'he',
      },
      {
        onSuccess: () => {
          onSuccess(BUSINESS_PROPOSALS_TEXT.success.created);
          onClose();
        },
        onError: (error) => {
          setSubmitError(getApiErrorMessage(error, M.saveError));
        },
      },
    );
  };

  const customerOptions = [
    {
      value: '',
      label: isCustomersLoading
        ? BUSINESS_PROPOSALS_TEXT.filters.customerLoading
        : isCustomersError
          ? BUSINESS_PROPOSALS_TEXT.filters.customerError
          : M.customerPlaceholder,
    },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose}>
        {M.cancel}
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={isSaving}>
        {M.submit}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={M.title} footer={footer}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-sm text-slate-500">{M.intro}</p>

        <Field label={M.customerLabel} htmlFor="bp-customer" required error={errors.customerId}>
          <Dropdown
            id="bp-customer"
            value={formState.customerId}
            onChange={(val) => setField('customerId', val)}
            options={customerOptions}
          />
        </Field>

        <Field
          label={M.requirementLabel}
          htmlFor="bp-requirement"
          required
          error={errors.businessRequirement}
        >
          <textarea
            id="bp-requirement"
            className={TEXTAREA_CLASS}
            rows={4}
            value={formState.businessRequirement}
            onChange={(event) => setField('businessRequirement', event.target.value)}
            placeholder={M.requirementPlaceholder}
          />
        </Field>

        <Field label={M.pricingLabel} htmlFor="bp-pricing" required error={errors.pricingModel}>
          <Dropdown
            id="bp-pricing"
            value={formState.pricingModel}
            onChange={(val) => setField('pricingModel', val)}
            options={[{ value: '', label: M.pricingPlaceholder }, ...PRICING_MODELS]}
          />
        </Field>

        {(needsEstimatedHours || needsHourlyRate) ? (
          <div className="grid grid-cols-2 gap-4">
            {needsEstimatedHours ? (
              <Field
                label={M.estimatedHoursLabel}
                htmlFor="bp-hours"
                required
                error={errors.estimatedHours}
              >
                <Input
                  id="bp-hours"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formState.estimatedHours}
                  onChange={(event) => setField('estimatedHours', event.target.value)}
                  placeholder={M.estimatedHoursPlaceholder}
                />
              </Field>
            ) : null}
            {needsHourlyRate ? (
              <Field
                label={M.hourlyRateLabel}
                htmlFor="bp-rate"
                required
                error={errors.hourlyRate}
              >
                <Input
                  id="bp-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.hourlyRate}
                  onChange={(event) => setField('hourlyRate', event.target.value)}
                  placeholder={M.hourlyRatePlaceholder}
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <Field label={M.currencyLabel} htmlFor="bp-currency">
            <Dropdown
              id="bp-currency"
              value={formState.currency}
              onChange={(val) => setField('currency', val)}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>
        </div>

        <Field
          label={M.paymentLabel}
          htmlFor="bp-payment"
          required
          error={errors.paymentDistribution}
        >
          <Input
            id="bp-payment"
            type="text"
            value={formState.paymentDistribution}
            onChange={(event) => setField('paymentDistribution', event.target.value)}
            placeholder={M.paymentPlaceholder}
          />
        </Field>

        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {submitError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

BusinessProposalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
