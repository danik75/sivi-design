import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import Dropdown from '@/components/chadcn/Dropdown';
import XIcon from '@/components/chadcn/icons/XIcon';
import useContracts from '@/features/contracts/hooks/useContracts';
import useCustomers from '@/features/customers/hooks/useCustomers';
import InvoiceLineItemsEditor from '@/features/invoices/components/InvoiceLineItemsEditor';
import TaskPickerDialog from '@/features/invoices/components/TaskPickerDialog';
import ExpensePickerDialog from '@/features/invoices/components/ExpensePickerDialog';
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
import { getAvailableTasks } from '@/features/invoices/services/invoicesApi';

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
    discountType: '',
    discountValue: '',
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

export default function InvoiceModal({ isOpen, onClose, invoice, onSuccess, onView }) {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState(createInitialState());
  const [lineItems, setLineItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [picker, setPicker] = useState(null); // 'tasks' | 'expenses' | null
  const skipAutoPrefillRef = useRef(false);
  const lineItemsInitializedRef = useRef(false);
  const prefillBuiltRef = useRef(''); // contractId whose line items were prepopulated (create)

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
  const { data: prefillData, refetch: refetchPrefill } = useInvoicePrefill(
    formState.contractId,
  );

  const isSaving =
    createMutation.isLoading ||
    createMutation.isPending ||
    updateMutation.isLoading ||
    updateMutation.isPending;
  const customers = customersData?.data ?? [];
  const contracts = contractsData?.data ?? contractsData ?? [];
  const contractMap = useMemo(
    () =>
      contracts.reduce((acc, contract) => {
        acc[contract.id] = contract;
        return acc;
      }, {}),
    [contracts]
  );

  // On create, load the customer's available (done, unlinked) tasks so we can
  // pre-populate the invoice and disable "Add from tasks" while all are added.
  const { data: availableTasks = [], isFetched: tasksFetched } = useQuery(
    ['available-tasks', formState.customerId, invoice?.id],
    () => getAvailableTasks(formState.customerId, invoice?.id),
    { enabled: isOpen && !invoice && Boolean(formState.customerId) }
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
    lineItemsInitializedRef.current = false; // reset so detail fetch can populate once
    prefillBuiltRef.current = ''; // reset so line items re-populate on (re)open
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
        discountType: invoice.discountType || '',
        discountValue: invoice.discountValue != null ? String(invoice.discountValue) : '',
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
          sourceDate: lineItem.sourceDate,
        }))
      );
      return;
    }

    setFormState(createInitialState());
    setLineItems([]);
  }, [invoice, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // In edit mode the list response has no lineItems — populate from the full detail fetch ONCE per open
  useEffect(() => {
    if (!isOpen || !invoice || !fullInvoice?.lineItems?.length) return;
    if (lineItemsInitializedRef.current) return; // guard against background re-fetches resetting user edits
    lineItemsInitializedRef.current = true;
    setLineItems(
      fullInvoice.lineItems.map((li) => ({
        description: li.description,
        quantity: String(li.quantity),
        unitPrice: String(li.unitPrice),
        amount: String(li.amount),
        sourceType: li.sourceType,
        sourceId: li.sourceId,
        sourceDate: li.sourceDate,
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

  // Build the initial line items once a contract is chosen: the contract fee
  // (from prefill) followed, on create, by ALL of the customer's available
  // (done, unlinked) tasks. Runs once per contract so background refetches
  // don't clobber the user's edits.
  useEffect(() => {
    if (!prefillData) return;
    // Create mode: wait until the available-tasks query has settled so we
    // don't lock in an empty task list before it loads.
    if (!invoice && !tasksFetched) return;
    if (prefillBuiltRef.current === formState.contractId) return;
    prefillBuiltRef.current = formState.contractId;

    const feeItems = prefillData.suggestedLineItems.map((lineItem) => ({
      description: lineItem.description,
      quantity: String(lineItem.quantity),
      unitPrice: String(lineItem.unitPrice),
      amount: String(lineItem.amount),
      sourceType: lineItem.sourceType,
      sourceId: lineItem.sourceId,
      sourceDate: lineItem.sourceDate ?? null,
    }));
    const taskItems = invoice ? [] : buildTaskLineItems(availableTasks);
    setLineItems([...feeItems, ...taskItems]);

    if (prefillData.currency && !formState.currency) {
      setFormState((prev) => ({ ...prev, currency: prefillData.currency }));
    }
  }, [prefillData, availableTasks, tasksFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = lineItems.reduce((sum, lineItem) => sum + parseFloat(lineItem.amount || 0), 0);
  const discountAmount = (() => {
    const val = parseFloat(formState.discountValue) || 0;
    if (!formState.discountType || val <= 0) return 0;
    return formState.discountType === 'percentage'
      ? Math.min((subtotal * val) / 100, subtotal)
      : Math.min(val, subtotal);
  })();
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * ((parseFloat(formState.taxRate) || 0) / 100);
  const total = discountedSubtotal + taxAmount;
  const stepLabel = step === 1 ? INVOICE_TEXT.modal.step1Title : INVOICE_TEXT.modal.step2Title;

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

  // Ids already on the invoice, so the pickers can show them checked/disabled.
  const linkedTaskIds = lineItems.filter((li) => li.sourceType === 'task').map((li) => li.sourceId);
  const linkedExpenseIds = lineItems
    .filter((li) => li.sourceType === 'expense')
    .map((li) => li.sourceId);

  // Map done tasks → invoice line items, applying the contract's rate
  // (T&M → hours × hourly rate; otherwise quantity 1 at price 0).
  const buildTaskLineItems = (tasks) => {
    const contract = contractMap[formState.contractId];
    const isTM = contract?.type === 'time_and_materials';
    const rate = Number(contract?.hourlyRate) || 0;
    return tasks.map((t) => {
      const hours = t.actualHours != null ? Number(t.actualHours) : Number(t.estimatedHours) || 1;
      const quantity = isTM ? hours || 1 : 1;
      const unitPrice = isTM ? rate : 0;
      return {
        description: t.name,
        quantity: String(quantity),
        unitPrice: String(unitPrice),
        amount: (quantity * unitPrice).toFixed(2),
        sourceType: 'task',
        sourceId: t.id,
        sourceDate: t.endDate,
      };
    });
  };

  const handleAddTasks = (tasks) => {
    handleLineItemsChange([...lineItems, ...buildTaskLineItems(tasks)]);
  };

  // "Add from tasks" is disabled while every available task is already on the invoice.
  const allTasksAdded =
    !invoice &&
    availableTasks.length > 0 &&
    availableTasks.every((t) => linkedTaskIds.includes(t.id));

  const handleAddExpenses = (expenses) => {
    const additions = expenses.map((e) => {
      const amount = Number(e.amount) || 0;
      return {
        description: e.description ? `${e.vendor} — ${e.description}` : e.vendor,
        quantity: '1',
        unitPrice: String(amount),
        amount: amount.toFixed(2),
        sourceType: 'expense',
        sourceId: e.id,
        sourceDate: e.date,
      };
    });
    handleLineItemsChange([...lineItems, ...additions]);
  };

  const handleNext = () => {
    const nextErrors = validateStep1(formState);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep(2);
  };

  // Explicit save — only ever called from the Save & Close / Save & View
  // buttons' onClick. No form submission is involved, so nothing implicit
  // (Enter key, focus, button-type quirks) can ever save/close the wizard.
  const submitInvoice = (action) => {
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
      discountType: formState.discountType || undefined,
      discountValue:
        formState.discountType && parseFloat(formState.discountValue) > 0
          ? parseFloat(formState.discountValue)
          : undefined,
      notes: formState.notes.trim() || undefined,
      lineItems: lineItems.map((lineItem) => ({
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity) || 1,
        unitPrice: parseFloat(lineItem.unitPrice) || 0,
        sourceType: lineItem.sourceType || 'manual',
        sourceId: lineItem.sourceId || undefined,
        sourceDate: lineItem.sourceDate || undefined,
      })),
    };

    const wantsView = action === 'view';

    if (invoice) {
      updateMutation.mutate(
        { id: invoice.id, ...payload },
        {
          onSuccess: (saved) => {
            onSuccess(INVOICE_TEXT.success.updated(saved.invoiceNumber));
            if (wantsView && onView) onView(saved);
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
        if (wantsView && onView) onView(saved);
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
            <Dropdown
              value={formState.customerId}
              onChange={(val) => handleFormChange('customerId', val)}
              options={[
                { value: '', label: isCustomersLoading ? INVOICE_TEXT.filters.customerLoading : isCustomersError ? INVOICE_TEXT.filters.customerError : INVOICE_TEXT.modal.customerPlaceholder },
                ...customers.map((c) => ({
                  value: c.id,
                  label: c.companyName ? `${c.name} — ${c.companyName}` : c.name,
                })),
              ]}
            />
            {errors.customerId ? (
              <p className="text-xs font-medium text-rose-600">{errors.customerId}</p>
            ) : null}
          </FormField>

          <FormField label={INVOICE_TEXT.modal.contractLabel} className="md:col-span-2">
            <Dropdown
              value={formState.contractId}
              onChange={(val) => handleFormChange('contractId', val)}
              options={[
                { value: '', label: isContractsLoading ? INVOICE_TEXT.modal.contractLoading : INVOICE_TEXT.modal.contractPlaceholder },
                ...contracts.map((c) => ({ value: c.id, label: c.name || c.typeLabel || INVOICE_TEXT.placeholder })),
              ]}
            />
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
            <Dropdown
              value={formState.currency}
              onChange={(val) => handleFormChange('currency', val)}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
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

          <FormField label={INVOICE_TEXT.modal.discountTypeLabel}>
            <Dropdown
              value={formState.discountType}
              onChange={(val) => handleFormChange('discountType', val)}
              options={[
                { value: '', label: INVOICE_TEXT.modal.discountTypePlaceholder },
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount' },
              ]}
            />
          </FormField>

          {formState.discountType ? (
            <FormField
              label={
                formState.discountType === 'percentage'
                  ? INVOICE_TEXT.modal.discountValuePercentLabel
                  : INVOICE_TEXT.modal.discountValueFixedLabel
              }
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                max={formState.discountType === 'percentage' ? 100 : undefined}
                value={formState.discountValue}
                onChange={(event) => handleFormChange('discountValue', event.target.value)}
                placeholder={formState.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
              />
            </FormField>
          ) : null}

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

    // Step 2 (final): line items + totals; saved from here.
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPicker('tasks')}
            disabled={!formState.customerId || allTasksAdded}
          >
            Add from tasks
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPicker('expenses')}
            disabled={!formState.customerId}
          >
            Add from expenses
          </Button>
        </div>
        <InvoiceLineItemsEditor lineItems={lineItems} onChange={handleLineItemsChange} />
        {errors.lineItems ? (
          <p className="text-xs font-medium text-rose-600">{errors.lineItems}</p>
        ) : null}

        <div className="flex justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>{INVOICE_TEXT.modal.review.subtotal}</span>
                <span>{formatAmount(subtotal, formState.currency)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>
                    {formState.discountType === 'percentage'
                      ? `Discount (${formState.discountValue}%)`
                      : 'Discount'}
                  </span>
                  <span>− {formatAmount(discountAmount, formState.currency)}</span>
                </div>
              ) : null}
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

    // Step 2 is the final step — save from here.
    return (
      <>
        <Button type="button" variant="ghost" onClick={() => setStep(1)}>
          {INVOICE_TEXT.modal.back}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={() => submitInvoice('close')}
        >
          {INVOICE_TEXT.modal.saveAndClose}
        </Button>
        <Button type="button" disabled={isSaving} onClick={() => submitInvoice('view')}>
          {INVOICE_TEXT.modal.saveAndView}
        </Button>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-12 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
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
        <Form id={FORM_ID} onSubmit={(e) => e.preventDefault()} className="space-y-0">
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
      <TaskPickerDialog
        isOpen={picker === 'tasks'}
        onClose={() => setPicker(null)}
        customerId={formState.customerId || undefined}
        excludeInvoiceId={invoice?.id}
        existingSourceIds={linkedTaskIds}
        onConfirm={handleAddTasks}
      />
      <ExpensePickerDialog
        isOpen={picker === 'expenses'}
        onClose={() => setPicker(null)}
        customerId={formState.customerId || undefined}
        excludeInvoiceId={invoice?.id}
        existingSourceIds={linkedExpenseIds}
        onConfirm={handleAddExpenses}
      />
    </>
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
  onView: PropTypes.func,
};

InvoiceModal.defaultProps = {
  invoice: null,
  onView: undefined,
};
