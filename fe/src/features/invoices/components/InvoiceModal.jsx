import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import Select from '@/components/chadcn/Select';
import XIcon from '@/components/chadcn/icons/XIcon';
import useContracts from '@/features/contracts/hooks/useContracts';
import useCustomers from '@/features/customers/hooks/useCustomers';
import InvoiceLineItemsEditor from '@/features/invoices/components/InvoiceLineItemsEditor';
import {
  CURRENCIES,
  formatAmount,
  getApiErrorMessage,
  INVOICE_TEXT,
} from '@/features/invoices/constants';
import useCreateInvoice from '@/features/invoices/hooks/useCreateInvoice';
import useInvoice from '@/features/invoices/hooks/useInvoice';
import useInvoicePrefill from '@/features/invoices/hooks/useInvoicePrefill';
import useUpdateInvoice from '@/features/invoices/hooks/useUpdateInvoice';

const FORM_ID = 'invoice-modal-form';
const TEXTAREA_CLASS_NAME =
  'block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function createInitialState() {
  return {
    customerId: '',
    contractId: '',
    issueDate: '',
    dueDate: '',
    currency: 'NIS',
    taxRate: 0,
    notes: '',
  };
}

function validateStep1(state) {
  const errs = {};
  if (!state.customerId) errs.customerId = INVOICE_TEXT.modal.customerRequired;
  if (!state.contractId) errs.contractId = INVOICE_TEXT.modal.contractRequired;
  if (!state.issueDate) errs.issueDate = INVOICE_TEXT.modal.issueDateRequired;
  if (!state.dueDate) errs.dueDate = INVOICE_TEXT.modal.dueDateRequired;
  if (state.issueDate && state.dueDate && state.dueDate < state.issueDate) {
    errs.dueDate = INVOICE_TEXT.modal.dueDateInvalid;
  }
  return errs;
}

function hasValidLineItems(items) {
  return items.some((item) => item.description?.trim());
}

export default function InvoiceModal({ isOpen, onClose, invoice, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState(createInitialState());
  const [lineItems, setLineItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const skipAutoPrefillRef = useRef(false);

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  // Fetch full invoice (with line items) when editing — the list response omits lineItems
  const { data: fullInvoice } = useInvoice(invoice?.id);
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({ limit: 10000 });
  const { data: contractsData, isLoading: isContractsLoading } = useContracts({
    customerId: formState.customerId || undefined,
    status: invoice ? undefined : 'active', // edit mode: show all contracts so the existing one appears
  });
  const {
    data: prefillData,
    error: prefillError,
    isFetching: isPrefillLoading,
    refetch: refetchPrefill,
  } = useInvoicePrefill(formState.contractId);

  const isSaving =
    createMutation.isLoading ||
    createMutation.isPending ||
    updateMutation.isLoading ||
    updateMutation.isPending;
  const customers = customersData?.data ?? [];
  const contracts = contractsData?.data ?? contractsData ?? [];
  const customerMap = useMemo(
    () =>
      customers.reduce((acc, customer) => {
        acc[customer.id] = customer.name;
        return acc;
      }, {}),
    [customers]
  );
  const contractMap = useMemo(
    () =>
      contracts.reduce((acc, contract) => {
        acc[contract.id] = contract;
        return acc;
      }, {}),
    [contracts]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setErrors({});
    setSubmitError('');
    createMutation.reset();
    updateMutation.reset();

    if (invoice) {
      skipAutoPrefillRef.current = true;
      setFormState({
        customerId: invoice.customerId,
        contractId: invoice.contractId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        taxRate: parseFloat(invoice.taxRate) || 0,
        notes: invoice.notes || '',
      });
      setLineItems(
        (invoice.lineItems || []).map((lineItem) => ({
          description: lineItem.description,
          quantity: lineItem.quantity,
          unitPrice: lineItem.unitPrice,
          amount: lineItem.amount,
          sourceType: lineItem.sourceType,
          sourceId: lineItem.sourceId,
        }))
      );
      return;
    }

    setFormState(createInitialState());
    setLineItems([]);
  }, [invoice, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // In edit mode the list response has no lineItems — populate from the full detail fetch
  useEffect(() => {
    if (!isOpen || !invoice || !fullInvoice?.lineItems?.length) return;
    setLineItems(
      fullInvoice.lineItems.map((li) => ({
        description: li.description,
        quantity: String(li.quantity),
        unitPrice: String(li.unitPrice),
        amount: String(li.amount),
        sourceType: li.sourceType,
        sourceId: li.sourceId,
      }))
    );
  }, [fullInvoice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!formState.contractId) return;
    if (lineItems.length > 0) return;
    if (skipAutoPrefillRef.current) {
      skipAutoPrefillRef.current = false;
      return;
    }
    refetchPrefill();
  }, [formState.contractId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!prefillData) return;
    setLineItems(
      prefillData.suggestedLineItems.map((lineItem) => ({
        description: lineItem.description,
        quantity: String(lineItem.quantity),
        unitPrice: String(lineItem.unitPrice),
        amount: String(lineItem.amount),
        sourceType: lineItem.sourceType,
        sourceId: lineItem.sourceId,
      }))
    );
    if (prefillData.currency && !formState.currency) {
      setFormState((prev) => ({ ...prev, currency: prefillData.currency }));
    }
  }, [prefillData]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = lineItems.reduce((sum, lineItem) => sum + parseFloat(lineItem.amount || 0), 0);
  const taxAmount = subtotal * ((parseFloat(formState.taxRate) || 0) / 100);
  const total = subtotal + taxAmount;
  const stepLabel =
    step === 1
      ? INVOICE_TEXT.modal.step1Title
      : step === 2
        ? INVOICE_TEXT.modal.step2Title
        : INVOICE_TEXT.modal.step3Title;

  const handleFormChange = (field, value) => {
    setFormState((current) => {
      if (field === 'customerId') {
        if (value === current.customerId) {
          return { ...current, customerId: value };
        }

        return {
          ...current,
          customerId: value,
          contractId: '',
        };
      }

      return { ...current, [field]: value };
    });

    if (field === 'customerId' || field === 'contractId') {
      setLineItems([]);
    }

    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      if (field === 'customerId') {
        delete nextErrors.contractId;
      }
      return nextErrors;
    });
  };

  const handleLineItemsChange = (nextLineItems) => {
    setLineItems(nextLineItems);
    setErrors((current) => {
      if (!current.lineItems || !hasValidLineItems(nextLineItems)) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.lineItems;
      return nextErrors;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      const nextErrors = validateStep1(formState);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      setStep(2);
      return;
    }

    if (!hasValidLineItems(lineItems)) {
      setErrors({ lineItems: INVOICE_TEXT.modal.lineItemsEmpty });
      return;
    }

    setErrors({});
    setStep(3);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');

    const step1Errors = validateStep1(formState);
    if (Object.keys(step1Errors).length) {
      setErrors(step1Errors);
      setStep(1);
      return;
    }

    if (!hasValidLineItems(lineItems)) {
      setErrors({ lineItems: INVOICE_TEXT.modal.lineItemsEmpty });
      setStep(2);
      return;
    }

    const payload = {
      customerId: formState.customerId,
      contractId: formState.contractId,
      issueDate: formState.issueDate,
      dueDate: formState.dueDate,
      currency: formState.currency,
      taxRate: parseFloat(formState.taxRate) || 0,
      notes: formState.notes.trim() || undefined,
      lineItems: lineItems.map((lineItem) => ({
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity) || 1,
        unitPrice: parseFloat(lineItem.unitPrice) || 0,
        sourceType: lineItem.sourceType || 'manual',
        sourceId: lineItem.sourceId || undefined,
      })),
    };

    if (invoice) {
      updateMutation.mutate(
        { id: invoice.id, ...payload },
        {
          onSuccess: (saved) => {
            onSuccess(INVOICE_TEXT.success.updated(saved.invoiceNumber));
            onClose();
          },
          onError: (error) =>
            setSubmitError(getApiErrorMessage(error, INVOICE_TEXT.modal.saveError)),
        }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (saved) => {
        onSuccess(INVOICE_TEXT.success.created(saved.invoiceNumber));
        onClose();
      },
      onError: (error) => setSubmitError(getApiErrorMessage(error, INVOICE_TEXT.modal.saveError)),
    });
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={INVOICE_TEXT.modal.customerLabel} className="md:col-span-2">
            <Select
              value={formState.customerId}
              onChange={(event) => handleFormChange('customerId', event.target.value)}
              aria-invalid={Boolean(errors.customerId)}
            >
              <option value="">{INVOICE_TEXT.modal.customerPlaceholder}</option>
              {isCustomersLoading ? (
                <option value="" disabled>
                  {INVOICE_TEXT.filters.customerLoading}
                </option>
              ) : null}
              {isCustomersError ? (
                <option value="" disabled>
                  {INVOICE_TEXT.filters.customerError}
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

          <FormField label={INVOICE_TEXT.modal.contractLabel} className="md:col-span-2">
            <Select
              value={formState.contractId}
              onChange={(event) => handleFormChange('contractId', event.target.value)}
              disabled={!formState.customerId}
              aria-invalid={Boolean(errors.contractId)}
            >
              <option value="">{INVOICE_TEXT.modal.contractPlaceholder}</option>
              {isContractsLoading ? (
                <option value="" disabled>
                  {INVOICE_TEXT.modal.contractLoading}
                </option>
              ) : null}
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name || contract.typeLabel || INVOICE_TEXT.placeholder}
                </option>
              ))}
            </Select>
            {errors.contractId ? (
              <p className="text-xs font-medium text-rose-600">{errors.contractId}</p>
            ) : null}
          </FormField>

          <FormField label={INVOICE_TEXT.modal.issueDateLabel}>
            <DatePicker
              value={formState.issueDate}
              onChange={(value) => handleFormChange('issueDate', value)}
            />
            {errors.issueDate ? (
              <p className="text-xs font-medium text-rose-600">{errors.issueDate}</p>
            ) : null}
          </FormField>

          <FormField label={INVOICE_TEXT.modal.dueDateLabel}>
            <DatePicker
              value={formState.dueDate}
              onChange={(value) => handleFormChange('dueDate', value)}
            />
            {errors.dueDate ? (
              <p className="text-xs font-medium text-rose-600">{errors.dueDate}</p>
            ) : null}
          </FormField>

          <FormField label={INVOICE_TEXT.modal.currencyLabel}>
            <Select
              value={formState.currency}
              onChange={(event) => handleFormChange('currency', event.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={INVOICE_TEXT.modal.taxRateLabel}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.taxRate}
              onChange={(event) => handleFormChange('taxRate', event.target.value)}
            />
          </FormField>

          <FormField label={INVOICE_TEXT.modal.notesLabel} className="md:col-span-2">
            <textarea
              className={TEXTAREA_CLASS_NAME}
              rows={4}
              value={formState.notes}
              onChange={(event) => handleFormChange('notes', event.target.value)}
              placeholder={INVOICE_TEXT.modal.notesPlaceholder}
            />
          </FormField>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => refetchPrefill()}
              disabled={!formState.contractId || isPrefillLoading}
            >
              {INVOICE_TEXT.modal.prefillButton}
            </Button>
            {isPrefillLoading ? (
              <p className="text-sm text-slate-500">{INVOICE_TEXT.modal.prefillLoading}</p>
            ) : null}
          </div>
          {prefillError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {getApiErrorMessage(prefillError, INVOICE_TEXT.modal.prefillError)}
            </p>
          ) : null}
          <InvoiceLineItemsEditor lineItems={lineItems} onChange={handleLineItemsChange} />
          {errors.lineItems ? (
            <p className="text-xs font-medium text-rose-600">{errors.lineItems}</p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
          <FormField label={INVOICE_TEXT.modal.customerLabel}>
            <p className="text-sm text-slate-700">
              {customerMap[formState.customerId] ||
                invoice?.customerName ||
                INVOICE_TEXT.placeholder}
            </p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.contractLabel}>
            <p className="text-sm text-slate-700">
              {contractMap[formState.contractId]?.name ||
                contractMap[formState.contractId]?.typeLabel ||
                invoice?.contractTypeLabel ||
                INVOICE_TEXT.placeholder}
            </p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.currencyLabel}>
            <p className="text-sm text-slate-700">
              {formState.currency || INVOICE_TEXT.placeholder}
            </p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.issueDateLabel}>
            <p className="text-sm text-slate-700">
              {formState.issueDate || INVOICE_TEXT.placeholder}
            </p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.dueDateLabel}>
            <p className="text-sm text-slate-700">
              {formState.dueDate || INVOICE_TEXT.placeholder}
            </p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.taxRateLabel}>
            <p className="text-sm text-slate-700">{`${parseFloat(formState.taxRate || 0)}%`}</p>
          </FormField>
          <FormField label={INVOICE_TEXT.modal.notesLabel} className="md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-700">{formState.notes || INVOICE_TEXT.placeholder}</p>
          </FormField>
        </div>

        <InvoiceLineItemsEditor lineItems={lineItems} onChange={handleLineItemsChange} readOnly />

        <div className="flex justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>{INVOICE_TEXT.modal.review.subtotal}</span>
                <span>{formatAmount(subtotal, formState.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{INVOICE_TEXT.modal.review.taxRate(parseFloat(formState.taxRate || 0))}</span>
                <span>{formatAmount(taxAmount, formState.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <span>{INVOICE_TEXT.modal.review.total}</span>
                <span>{formatAmount(total, formState.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (step === 1) {
      return (
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {INVOICE_TEXT.modal.cancel}
          </Button>
          <Button type="button" onClick={handleNext}>
            {INVOICE_TEXT.modal.next}
          </Button>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Button type="button" variant="ghost" onClick={() => setStep(1)}>
            {INVOICE_TEXT.modal.back}
          </Button>
          <Button type="button" onClick={handleNext}>
            {INVOICE_TEXT.modal.next}
          </Button>
        </>
      );
    }

    return (
      <>
        <Button type="button" variant="ghost" onClick={() => setStep(2)}>
          {INVOICE_TEXT.modal.back}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {INVOICE_TEXT.modal.submit}
        </Button>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {invoice ? INVOICE_TEXT.modal.editTitle : INVOICE_TEXT.modal.createTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {INVOICE_TEXT.modal.progressLabel(stepLabel, step)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            aria-label={INVOICE_TEXT.modal.closeLabel}
          >
            <XIcon />
          </button>
        </div>
        <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-0">
          <div className="space-y-5 px-6 py-5">{renderStep()}</div>
          {submitError ? (
            <div className="px-6">
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {submitError}
              </p>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {renderFooter()}
          </div>
        </Form>
      </div>
    </div>
  );
}

const lineItemShape = PropTypes.shape({
  id: PropTypes.string,
  description: PropTypes.string,
  quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unitPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sourceType: PropTypes.string,
  sourceId: PropTypes.string,
});

InvoiceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoice: PropTypes.shape({
    id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string,
    customerId: PropTypes.string,
    customerName: PropTypes.string,
    contractId: PropTypes.string,
    contractTypeLabel: PropTypes.string,
    issueDate: PropTypes.string,
    dueDate: PropTypes.string,
    currency: PropTypes.string,
    taxRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notes: PropTypes.string,
    lineItems: PropTypes.arrayOf(lineItemShape),
  }),
  onSuccess: PropTypes.func.isRequired,
};

InvoiceModal.defaultProps = {
  invoice: null,
};
