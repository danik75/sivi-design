export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CURRENCIES = ['NIS', 'USD'];

export function getStatusVariant(status) {
  switch (status) {
    case 'draft':
      return 'default';
    case 'sent':
      return 'primary';
    case 'paid':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

export const isEditable = (status) => status === 'draft' || status === 'sent';

export const formatAmount = (amount, currency) =>
  amount != null ? `${parseFloat(amount).toFixed(2)} ${currency ?? ''}`.trim() : '—';

export function getApiErrorMessage(error, fallback) {
  const message = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}

export const INVOICE_TEXT = {
  title: 'Invoices',
  description: 'Create and manage customer invoices.',
  addInvoice: 'New Invoice',
  loading: 'Loading invoices...',
  loadError: 'Unable to load invoices.',
  retry: 'Retry',
  clearFilters: 'Clear filters',
  placeholder: '—',
  noDataTitle: 'No invoices yet',
  noDataDescription: 'Create your first invoice to start billing customers.',
  noResultsTitle: 'No matching invoices',
  noResultsDescription: 'Try adjusting the filters.',
  emptyStateIcons: { empty: '🧾', filtered: '🔎' },
  status: { draft: 'Draft', sent: 'Sent', paid: 'Paid', cancelled: 'Cancelled' },
  headers: {
    invoiceNumber: 'Invoice #',
    customer: 'Customer',
    contract: 'Contract',
    status: 'Status',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    total: 'Total',
    actions: 'Actions',
  },
  filters: {
    customerLabel: 'Customer',
    customerPlaceholder: 'All customers',
    customerLoading: 'Loading…',
    customerError: 'Error loading customers',
    statusLabel: 'Status',
    statusPlaceholder: 'All statuses',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    label: (page, total) => `Page ${page} of ${total}`,
  },
  rowActions: {
    edit: 'Edit',
    editLabel: 'Edit invoice',
    delete: 'Delete',
    deleteLabel: 'Delete invoice',
    markSent: 'Mark as Sent',
    markPaid: 'Mark as Paid',
    cancel: 'Cancel Invoice',
  },
  modal: {
    createTitle: 'New Invoice',
    editTitle: 'Edit Invoice',
    step1Title: 'Invoice Details',
    step2Title: 'Line Items',
    step3Title: 'Review',
    progressLabel: (label, step) => `${label} · Step ${step} of 3`,
    closeLabel: 'Close invoice modal',
    back: 'Back',
    next: 'Next',
    submit: 'Save Invoice',
    saveAndClose: 'Save & Close',
    saveAndView: 'Save & View',
    cancel: 'Cancel',
    customerLabel: 'Customer',
    customerPlaceholder: 'Select customer…',
    customerRequired: 'Customer is required.',
    contractLabel: 'Contract',
    contractPlaceholder: 'Select contract…',
    contractRequired: 'Contract is required.',
    contractLoading: 'Loading contracts…',
    issueDateLabel: 'Issue Date',
    issueDateRequired: 'Issue date is required.',
    dueDateLabel: 'Due Date',
    dueDateRequired: 'Due date is required.',
    dueDateInvalid: 'Due date must be on or after issue date.',
    currencyLabel: 'Currency',
    taxRateLabel: 'Tax Rate (%)',
    discountTypeLabel: 'Discount',
    discountTypePlaceholder: 'No discount',
    discountValuePercentLabel: 'Discount (%)',
    discountValueFixedLabel: 'Discount Amount',
    notesLabel: 'Notes',
    notesPlaceholder: 'Optional invoice notes…',
    lineItemsEmpty: 'At least one line item is required.',
    addLineItem: '+ Add line item',
    prefillButton: 'Auto-fill from contract',
    prefillLoading: 'Loading suggestions…',
    prefillError: 'Unable to load suggestions.',
    lineItem: {
      description: 'Description',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      amount: 'Amount',
      remove: 'Remove',
    },
    review: {
      subtotal: 'Subtotal',
      taxRate: (rate) => `Tax (${rate}%)`,
      taxAmount: 'Tax',
      total: 'Total',
    },
    saveError: 'Unable to save invoice.',
  },
  deleteDialog: {
    title: 'Delete Invoice',
    description: (invoiceNumber) => `Delete ${invoiceNumber}? This cannot be undone.`,
    cancel: 'Cancel',
    confirm: 'Delete',
    error: 'Unable to delete invoice.',
  },
  success: {
    created: (num) => `Invoice ${num} created.`,
    updated: (num) => `Invoice ${num} updated.`,
    deleted: (num) => `Invoice ${num} deleted.`,
    statusChanged: (num, status) => `Invoice ${num} marked as ${status}.`,
  },
  statusChangeError: 'Status change failed.',
};
