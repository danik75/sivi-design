export const CONTRACT_TYPES = [
  { value: 'lump_sum', label: 'Lump Sum' },
  { value: 'time_and_materials', label: 'Time & Materials (T&M)' },
  { value: 'prepaid_hours', label: 'Prepaid Hours Block' },
  { value: 'monthly_retainer', label: 'Monthly Retainer' },
];

export const CONTRACT_TYPE_MAP = CONTRACT_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatNumber(value, options = {}) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

function formatCurrency(value, currency) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const amount = Number(value);
  const normalizedCurrency = (currency || '').toUpperCase();

  if (Number.isNaN(amount)) {
    return [value, normalizedCurrency].filter(Boolean).join(' ');
  }

  if (!normalizedCurrency) {
    return formatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${formatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${normalizedCurrency}`;
  }
}

export function getTypeSpecificDetails(contract) {
  const currency = contract?.currency?.toUpperCase() || '';

  if (contract?.type === 'lump_sum') {
    const totalAmount = formatCurrency(contract?.totalAmount, currency);
    return totalAmount
      ? `${CONTRACT_TEXT.details.total}: ${totalAmount}${currency ? ` ${currency}` : ''}`
      : CONTRACT_TEXT.placeholder;
  }

  if (contract?.type === 'time_and_materials') {
    const hourlyRate = formatCurrency(contract?.hourlyRate, currency);
    return hourlyRate
      ? `${CONTRACT_TEXT.details.rate}: ${hourlyRate}/${CONTRACT_TEXT.details.hourSuffix}${currency ? ` ${currency}` : ''}`
      : CONTRACT_TEXT.placeholder;
  }

  if (contract?.type === 'prepaid_hours') {
    const details = [
      contract?.hoursPurchased
        ? `${CONTRACT_TEXT.details.hours}: ${formatNumber(contract.hoursPurchased)} ${CONTRACT_TEXT.details.hoursUnit}`
        : '',
      contract?.amountPaid
        ? `${CONTRACT_TEXT.details.paid}: ${formatCurrency(contract.amountPaid, currency)}${currency ? ` ${currency}` : ''}`
        : '',
    ].filter(Boolean);
    return details.length
      ? details.join(` ${CONTRACT_TEXT.details.separator} `)
      : CONTRACT_TEXT.placeholder;
  }

  if (contract?.type === 'monthly_retainer') {
    const details = [
      contract?.monthlyFee
        ? `${CONTRACT_TEXT.details.fee}: ${formatCurrency(contract.monthlyFee, currency)}/${CONTRACT_TEXT.details.monthSuffix}${currency ? ` ${currency}` : ''}`
        : '',
      contract?.hoursPerMonth
        ? `${CONTRACT_TEXT.details.hoursPerMonth}: ${formatNumber(contract.hoursPerMonth)} ${CONTRACT_TEXT.details.hoursUnit}`
        : '',
    ].filter(Boolean);
    return details.length
      ? details.join(` ${CONTRACT_TEXT.details.separator} `)
      : CONTRACT_TEXT.placeholder;
  }

  return CONTRACT_TEXT.placeholder;
}

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

export const CONTRACT_TEXT = {
  title: 'Contracts',
  description: 'Manage customer contracts.',
  addContract: 'Add Contract',
  loading: 'Loading contracts...',
  loadError: 'Unable to load contracts.',
  retry: 'Retry',
  clearFilters: 'Clear filters',
  noDataTitle: 'No contracts yet',
  noDataDescription: 'Add your first contract to start tracking customer agreements.',
  noResultsTitle: 'No matching contracts',
  noResultsDescription: 'Try a different customer or status filter.',
  placeholder: '—',
  emptyStateIcons: {
    empty: '📝',
    filtered: '🔎',
  },
  filters: {
    customerLabel: 'Customer',
    customerPlaceholder: 'All customers',
    customerLoading: 'Loading customers...',
    customerError: 'Unable to load customers.',
    statusLabel: 'Status',
    active: 'Active',
    all: 'All',
  },
  headers: {
    name: 'Name',
    type: 'Type',
    details: 'Details',
    status: 'Status',
    created: 'Created',
    expires: 'Expires',
    actions: 'Actions',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
  },
  details: {
    total: 'Total',
    rate: 'Rate',
    paid: 'Paid',
    fee: 'Fee',
    hours: 'Hours',
    hoursPerMonth: 'Hours/mo',
    hourSuffix: 'hr',
    monthSuffix: 'mo',
    hoursUnit: 'hrs',
    separator: '•',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    label: (page, totalPages) => `Page ${page} of ${totalPages}`,
  },
  rowActions: {
    deactivate: 'Deactivate',
    deactivateLabel: 'Deactivate contract',
  },
  modal: {
    title: 'Add Contract',
    commonSectionTitle: 'Common Details',
    typeSectionTitle: 'Contract Terms',
    customerLabel: 'Customer',
    customerPlaceholder: 'Select customer...',
    typeLabel: 'Contract Type',
    typePlaceholder: 'Select contract type...',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Add contract notes',
    expirationLabel: 'Expiration Date',
    expirationPlaceholder: 'Select date',
    totalAmountLabel: 'Total Amount',
    totalAmountPlaceholder: '15000',
    hourlyRateLabel: 'Hourly Rate',
    hourlyRatePlaceholder: '120',
    hoursPurchasedLabel: 'Hours Purchased',
    hoursPurchasedPlaceholder: '40',
    amountPaidLabel: 'Amount Paid',
    amountPaidPlaceholder: '4800',
    monthlyFeeLabel: 'Monthly Fee',
    monthlyFeePlaceholder: '3000',
    hoursPerMonthLabel: 'Hours Per Month',
    hoursPerMonthPlaceholder: '20',
    currencyLabel: 'Currency',
    currencyPlaceholder: 'USD',
    cancel: 'Cancel',
    submit: 'Save Contract',
    saveError: 'Unable to save contract.',
    customerRequired: 'Customer is required.',
    typeRequired: 'Contract type is required.',
    totalAmountRequired: 'Total amount is required.',
    hourlyRateRequired: 'Hourly rate is required.',
    hoursPurchasedRequired: 'Hours purchased is required.',
    amountPaidRequired: 'Amount paid is required.',
    monthlyFeeRequired: 'Monthly fee is required.',
    hoursPerMonthRequired: 'Hours per month is required.',
    currencyRequired: 'Currency is required.',
  },
  deactivateDialog: {
    title: 'Deactivate Contract',
    description: (name) =>
      `Deactivate ${name}? The contract will be marked inactive. This action cannot be undone.`,
    cancel: 'Cancel',
    confirm: 'Deactivate',
    error: 'Unable to deactivate contract.',
  },
  success: {
    created: (name) => `${name} created.`,
    deactivated: (name) => `${name} deactivated.`,
  },
};
