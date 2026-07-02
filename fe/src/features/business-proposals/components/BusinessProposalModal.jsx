import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'Hebrew' },
];
const CURRENCIES = ['NIS', 'USD'];

const STEP_KEYS = {
  customerId: 'customerId',
  businessRequirement: 'businessRequirement',
  pricingModel: 'pricingModel',
  estimatedHours: 'estimatedHours',
  hourlyRate: 'hourlyRate',
  currency: 'currency',
  paymentDistribution: 'paymentDistribution',
  requestedLanguage: 'requestedLanguage',
};

function createInitialState() {
  return {
    customerId: '',
    businessRequirement: '',
    pricingModel: '',
    estimatedHours: '',
    hourlyRate: '',
    currency: 'NIS',
    paymentDistribution: '',
    requestedLanguage: 'en',
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

function buildFlow(pricingModel) {
  const flow = [
    STEP_KEYS.customerId,
    STEP_KEYS.businessRequirement,
    STEP_KEYS.pricingModel,
  ];

  if (requiresEstimatedHours(pricingModel)) {
    flow.push(STEP_KEYS.estimatedHours);
  }

  if (requiresHourlyRate(pricingModel)) {
    flow.push(STEP_KEYS.hourlyRate);
  }

  flow.push(STEP_KEYS.currency);
  flow.push(STEP_KEYS.paymentDistribution);
  flow.push(STEP_KEYS.requestedLanguage);
  return flow;
}

function hasValue(formState, key) {
  const value = formState[key];
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

function firstPendingStep(flow, formState) {
  return flow.find((step) => !hasValue(formState, step)) ?? null;
}

export default function BusinessProposalModal({ isOpen, onClose, onSuccess }) {
  const createMutation = useCreateBusinessProposal();
  const [formState, setFormState] = useState(createInitialState);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [stepError, setStepError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const conversationRef = useRef(null);
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({ limit: 10000 });
  const customers = customersData?.data ?? [];
  const isSaving = createMutation.isLoading || createMutation.isPending;

  const flow = useMemo(() => buildFlow(formState.pricingModel), [formState.pricingModel]);
  const currentStep = useMemo(() => firstPendingStep(flow, formState), [flow, formState]);
  const isComplete = !currentStep;
  const completedSteps = useMemo(
    () => flow.filter((step) => hasValue(formState, step)),
    [flow, formState],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFormState(createInitialState());
    setDraftAnswer('');
    setStepError('');
    setSubmitError('');
    createMutation.reset();
  }, [isOpen]);

  useEffect(() => {
    if (!currentStep) {
      setDraftAnswer('');
      return;
    }
    setDraftAnswer(formState[currentStep] ?? '');
    setStepError('');
  }, [currentStep, formState]);

  useEffect(() => {
    if (!isOpen || !conversationRef.current) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const node = conversationRef.current;
      if (node) {
        node.scrollTop = node.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, completedSteps.length, currentStep, stepError, submitError]);

  const questionByStep = {
    customerId: BUSINESS_PROPOSALS_TEXT.modal.customerQuestion,
    businessRequirement: BUSINESS_PROPOSALS_TEXT.modal.requirementQuestion,
    pricingModel: BUSINESS_PROPOSALS_TEXT.modal.pricingQuestion,
    estimatedHours: BUSINESS_PROPOSALS_TEXT.modal.estimatedHoursQuestion,
    hourlyRate: BUSINESS_PROPOSALS_TEXT.modal.hourlyRateQuestion,
    currency: BUSINESS_PROPOSALS_TEXT.modal.currencyQuestion,
    paymentDistribution: BUSINESS_PROPOSALS_TEXT.modal.paymentQuestion,
    requestedLanguage: BUSINESS_PROPOSALS_TEXT.modal.languageQuestion,
  };

  const displayAnswer = (step) => {
    const raw = formState[step];
    if (step === 'customerId') {
      return customers.find((customer) => customer.id === raw)?.name ?? BUSINESS_PROPOSALS_TEXT.placeholder;
    }
    if (step === 'pricingModel') {
      return PRICING_MODELS.find((model) => model.value === raw)?.label ?? raw;
    }
    if (step === 'requestedLanguage') {
      return LANGUAGES.find((language) => language.value === raw)?.label ?? raw;
    }
    return raw || BUSINESS_PROPOSALS_TEXT.placeholder;
  };

  const validateDraft = () => {
    if (!currentStep) {
      return false;
    }

    if (currentStep === STEP_KEYS.customerId && !draftAnswer) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredCustomer);
      return false;
    }
    if (currentStep === STEP_KEYS.businessRequirement && !draftAnswer.trim()) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredBusinessRequirement);
      return false;
    }
    if (currentStep === STEP_KEYS.pricingModel && !draftAnswer) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredPricingModel);
      return false;
    }
    if (currentStep === STEP_KEYS.estimatedHours && Number(draftAnswer) <= 0) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredEstimatedHours);
      return false;
    }
    if (currentStep === STEP_KEYS.hourlyRate && Number(draftAnswer) <= 0) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredHourlyRate);
      return false;
    }
    if (currentStep === STEP_KEYS.paymentDistribution && !draftAnswer.trim()) {
      setStepError(BUSINESS_PROPOSALS_TEXT.modal.requiredPaymentDistribution);
      return false;
    }

    return true;
  };

  const commitCurrentStep = () => {
    if (!currentStep || !validateDraft()) {
      return;
    }
    setFormState((current) => ({
      ...current,
      [currentStep]:
        currentStep === STEP_KEYS.businessRequirement || currentStep === STEP_KEYS.paymentDistribution
          ? draftAnswer.trim()
          : draftAnswer,
    }));
  };

  const handleSubmit = () => {
    if (!isComplete) {
      return;
    }

    setSubmitError('');
    createMutation.mutate(
      {
        customerId: formState.customerId,
        businessRequirement: formState.businessRequirement.trim(),
        pricingModel: formState.pricingModel,
        estimatedHours: formState.estimatedHours ? Number(formState.estimatedHours) : undefined,
        hourlyRate: formState.hourlyRate ? Number(formState.hourlyRate) : undefined,
        currency: formState.currency,
        paymentDistribution: formState.paymentDistribution.trim(),
        requestedLanguage: formState.requestedLanguage,
      },
      {
        onSuccess: () => {
          onSuccess(BUSINESS_PROPOSALS_TEXT.success.created);
          onClose();
        },
        onError: (error) => {
          setSubmitError(getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.modal.saveError));
        },
      }
    );
  };

  const renderInputControl = () => {
    if (!currentStep) {
      return null;
    }

    if (currentStep === STEP_KEYS.customerId) {
      return (
        <Dropdown
          value={draftAnswer}
          onChange={(val) => setDraftAnswer(val)}
          options={[
            { value: '', label: isCustomersLoading ? BUSINESS_PROPOSALS_TEXT.filters.customerLoading : isCustomersError ? BUSINESS_PROPOSALS_TEXT.filters.customerError : BUSINESS_PROPOSALS_TEXT.filters.customerPlaceholder },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      );
    }

    if (currentStep === STEP_KEYS.pricingModel) {
      return (
        <Dropdown
          value={draftAnswer}
          onChange={(val) => setDraftAnswer(val)}
          options={[
            { value: '', label: BUSINESS_PROPOSALS_TEXT.modal.requiredPricingModel },
            ...PRICING_MODELS,
          ]}
        />
      );
    }

    if (currentStep === STEP_KEYS.currency) {
      return (
        <Dropdown
          value={draftAnswer}
          onChange={(val) => setDraftAnswer(val)}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      );
    }

    if (currentStep === STEP_KEYS.requestedLanguage) {
      return (
        <Dropdown
          value={draftAnswer}
          onChange={(val) => setDraftAnswer(val)}
          options={LANGUAGES}
        />
      );
    }

    if (currentStep === STEP_KEYS.businessRequirement) {
      return (
        <textarea
          className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
          rows={4}
          value={draftAnswer}
          onChange={(event) => setDraftAnswer(event.target.value)}
          placeholder={BUSINESS_PROPOSALS_TEXT.modal.requirementPlaceholder}
        />
      );
    }

    if (currentStep === STEP_KEYS.paymentDistribution) {
      return (
        <Input
          type="text"
          value={draftAnswer}
          onChange={(event) => setDraftAnswer(event.target.value)}
          placeholder={BUSINESS_PROPOSALS_TEXT.modal.paymentPlaceholder}
        />
      );
    }

    return (
      <Input
        type="number"
        min="0"
        step={currentStep === STEP_KEYS.hourlyRate ? '0.01' : '0.1'}
        value={draftAnswer}
        onChange={(event) => setDraftAnswer(event.target.value)}
        placeholder={
          currentStep === STEP_KEYS.hourlyRate
            ? BUSINESS_PROPOSALS_TEXT.modal.hourlyRatePlaceholder
            : BUSINESS_PROPOSALS_TEXT.modal.estimatedHoursPlaceholder
        }
      />
    );
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose}>
        {BUSINESS_PROPOSALS_TEXT.modal.cancel}
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={!isComplete || isSaving}>
        {BUSINESS_PROPOSALS_TEXT.modal.submit}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={BUSINESS_PROPOSALS_TEXT.modal.title} footer={footer}>
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {BUSINESS_PROPOSALS_TEXT.modal.intro}
        </div>

        <div ref={conversationRef} className="max-h-[48vh] space-y-3 overflow-y-auto pr-1">
          {completedSteps.map((step) => (
            <div key={step} className="space-y-2">
              <div className="max-w-[90%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {questionByStep[step]}
              </div>
              <div className="ml-auto max-w-[90%] rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
                {displayAnswer(step)}
              </div>
            </div>
          ))}

          {currentStep ? (
            <div className="space-y-2">
              <div className="max-w-[90%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {questionByStep[currentStep]}
              </div>
              <div className="space-y-2">
                {renderInputControl()}
                <div className="flex justify-end">
                  <Button type="button" onClick={commitCurrentStep}>
                    {BUSINESS_PROPOSALS_TEXT.modal.send}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {stepError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {stepError}
          </p>
        ) : null}
        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {submitError}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

BusinessProposalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
