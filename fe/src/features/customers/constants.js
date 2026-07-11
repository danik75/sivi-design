export const CUSTOMER_TEXT = {
  title: 'Customers',
  description: 'Manage customer records and contact details.',
  addCustomer: 'Add Customer',
  searchPlaceholder: 'Search customers',
  loading: 'Loading customers...',
  loadError: 'Unable to load customers.',
  noDataTitle: 'No customers yet',
  noDataDescription: 'Add your first customer to start organizing contacts.',
  noResultsTitle: 'No matching customers',
  noResultsDescription: 'Try a different search term or create a new customer.',
  retry: 'Retry',
  clearSearch: 'Clear search',
  headers: {
    name: 'Name',
    companyNumber: 'Company No.',
    email: 'Email',
    phone: 'Phone',
    contacts: 'Contacts',
    actions: 'Actions',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    label: (page, totalPages) => `Page ${page} of ${totalPages}`,
  },
  contactCard: {
    title: (index) => `Contact ${index + 1}`,
    primary: 'Primary',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    addressLabel: 'Address',
    emailPlaceholder: 'name@company.com',
    phonePlaceholder: 'Add phone number',
    addressPlaceholder: 'Add address',
    remove: 'Remove',
  },
  modal: {
    createTitle: 'Add Customer',
    editTitle: 'Edit Customer',
    nameLabel: 'Name',
    namePlaceholder: 'Enter customer name',
    titleLabel: 'Title',
    titlePlaceholder: 'Optional (e.g. VP Design)',
    customerSection: 'Customer',
    companySection: 'Company',
    companyHint: 'Optional',
    companyNameLabel: 'Company Name',
    companyNamePlaceholder: 'Optional',
    companyNumberLabel: 'Company Number',
    companyNumberPlaceholder: 'Registration / tax ID',
    companyPhoneLabel: 'Telephone',
    companyPhonePlaceholder: 'Company phone',
    companyEmailLabel: 'Email',
    companyEmailPlaceholder: 'company@example.com',
    addressLabel: 'Address',
    addressPlaceholder: 'Street, city, country',
    contactsLabel: 'Contacts',
    contactsHint: 'Star the primary contact.',
    contactsRequired: 'At least one contact is required.',
    addContact: 'Add contact',
    contactNameLabel: 'Name',
    contactTitleLabel: 'Title',
    contactPhoneLabel: 'Phone',
    contactEmailLabel: 'Email',
    cancel: 'Cancel',
    createSubmit: 'Save Customer',
    editSubmit: 'Save Changes',
    nameRequired: 'Customer name is required.',
    saveError: 'Unable to save customer.',
  },
  deleteDialog: {
    title: 'Delete Customer',
    description: (name) =>
      `Delete ${name}? This will remove the customer and all contacts. Cannot be undone.`,
    cancel: 'Cancel',
    confirm: 'Delete',
    error: 'Unable to delete customer.',
  },
  rowActions: {
    edit: 'Edit customer',
    delete: 'Delete customer',
  },
  placeholder: '—',
  success: {
    created: (name) => `${name} created.`,
    updated: (name) => `${name} updated.`,
    deleted: (name) => `${name} deleted.`,
  },
};

export function createEmptyContact(isPrimary = false) {
  return {
    name: '',
    title: '',
    phone: '',
    email: '',
    isPrimary,
  };
}

export function getPrimaryContact(customer) {
  return (
    customer?.contacts?.find((contact) => contact?.isPrimary) ??
    customer?.contacts?.[0] ??
    createEmptyContact()
  );
}

export function normalizeCustomerPayload({
  name,
  title,
  companyName,
  companyNumber,
  companyPhone,
  companyEmail,
  address,
  contacts,
}) {
  const filtered = contacts
    .map((contact) => ({
      name: contact.name?.trim() ?? '',
      title: contact.title?.trim() ?? '',
      email: contact.email?.trim() ?? '',
      phone: contact.phone?.trim() ?? '',
      isPrimary: Boolean(contact.isPrimary),
    }))
    .filter((contact) => contact.name || contact.email || contact.phone);

  // ensure exactly one primary — keep user's choice, fall back to first
  const hasPrimary = filtered.some((c) => c.isPrimary);
  const normalizedContacts = filtered.map((c, i) => ({
    ...c,
    isPrimary: hasPrimary ? c.isPrimary : i === 0,
  }));

  return {
    name: name.trim(),
    title: title?.trim() || null,
    companyName: companyName?.trim() || null,
    companyNumber: companyNumber?.trim() || null,
    companyPhone: companyPhone?.trim() || null,
    companyEmail: companyEmail?.trim() || null,
    address: address?.trim() || null,
    contacts: normalizedContacts,
  };
}

export function getApiErrorMessage(error, fallbackMessage) {
  const message = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallbackMessage;
}
