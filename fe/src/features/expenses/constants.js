export const EXPENSE_CATEGORIES = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'travel', label: 'Travel' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

export const EXPENSE_CATEGORY_MAP = EXPENSE_CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const CURRENCIES = ['NIS', 'USD'];

export function getApiErrorMessage(error, fallback) {
  const message = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}

export function getStatusVariant(status) {
  return status === 'active' ? 'primary' : 'default';
}

export function formatAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === '') {
    return [currency].filter(Boolean).join(' ');
  }

  const numericAmount = Number(amount);
  const formattedAmount = Number.isNaN(numericAmount) ? String(amount) : numericAmount.toFixed(2);

  return [formattedAmount, currency].filter(Boolean).join(' ');
}

export const EXPENSE_TEXT = {
  title: 'Expenses',
  description: 'Manage third-party expenses.',
  addExpense: 'Create Expense',
  loading: 'Loading expenses...',
  loadError: 'Unable to load expenses.',
  retry: 'Retry',
  clearFilters: 'Clear filters',
  noDataTitle: 'No expenses yet',
  noDataDescription: 'Add your first expense to start tracking external costs.',
  noResultsTitle: 'No matching expenses',
  noResultsDescription: 'Try a different customer, category, or status filter.',
  emptyStateIcons: {
    empty: '🧾',
    filtered: '🔎',
  },
  placeholder: '—',
  status: {
    active: 'Active',
    inactive: 'Inactive',
  },
  headers: {
    vendor: 'Vendor',
    category: 'Category',
    amount: 'Amount',
    customer: 'Customer',
    date: 'Date',
    status: 'Status',
    actions: 'Actions',
  },
  filters: {
    customerLabel: 'Customer',
    customerPlaceholder: 'All customers',
    customerLoading: 'Loading customers...',
    customerError: 'Unable to load customers.',
    categoryLabel: 'Category',
    categoryPlaceholder: 'All categories',
    statusLabel: 'Status',
    active: 'Active',
    all: 'All',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    label: (page, totalPages) => `Page ${page} of ${totalPages}`,
  },
  modal: {
    title: 'Create Expense',
    vendorLabel: 'Vendor',
    vendorPlaceholder: 'AWS',
    vendorRequired: 'Vendor is required.',
    categoryLabel: 'Category',
    typePlaceholder: 'Select expense category...',
    categoryRequired: 'Category is required.',
    amountLabel: 'Amount',
    amountPlaceholder: '250.00',
    amountRequired: 'Amount must be greater than 0.',
    currencyLabel: 'Currency',
    dateLabel: 'Date',
    datePlaceholder: 'Select date',
    dateRequired: 'Date is required.',
    customerLabel: 'Customer',
    customerPlaceholder: 'No customer',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Add expense notes',
    cancel: 'Cancel',
    submit: 'Save Expense',
    saveError: 'Unable to save expense.',
  },
  deactivateDialog: {
    title: 'Deactivate Expense',
    description: (vendor) =>
      `Deactivate ${vendor}? The expense will be marked inactive. This action cannot be undone.`,
    cancel: 'Cancel',
    confirm: 'Deactivate',
    error: 'Unable to deactivate expense.',
  },
  rowActions: {
    deactivate: 'Deactivate',
    deactivateLabel: 'Deactivate expense',
  },
  success: {
    created: (vendor) => `${vendor} created.`,
    deactivated: (vendor) => `${vendor} deactivated.`,
  },
};
