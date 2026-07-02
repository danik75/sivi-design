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
    contactsLabel: 'Contacts',
    contactsHint: 'Keep the primary contact first in the list.',
    addContact: 'Add Contact',
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
    email: '',
    phone: '',
    address: '',
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

export function normalizeCustomerPayload({ name, contacts }) {
  const filtered = contacts
    .map((contact) => ({
      email: contact.email?.trim() ?? '',
      phone: contact.phone?.trim() ?? '',
      address: contact.address?.trim() ?? '',
      isPrimary: Boolean(contact.isPrimary),
    }))
    .filter((contact) => contact.email || contact.phone || contact.address);

  // ensure exactly one primary — keep user's choice, fall back to first
  const hasPrimary = filtered.some((c) => c.isPrimary);
  const normalizedContacts = filtered.map((c, i) => ({
    ...c,
    isPrimary: hasPrimary ? c.isPrimary : i === 0,
  }));

  return { name: name.trim(), contacts: normalizedContacts };
}

export function getApiErrorMessage(error, fallbackMessage) {
  const message = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallbackMessage;
}
