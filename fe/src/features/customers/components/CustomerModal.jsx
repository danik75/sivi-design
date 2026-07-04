import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import PencilIcon from '@/components/chadcn/icons/PencilIcon';
import XIcon from '@/components/chadcn/icons/XIcon';
import ContactModal from '@/features/customers/components/ContactModal';
import {
  CUSTOMER_TEXT,
  createEmptyContact,
  getApiErrorMessage,
  normalizeCustomerPayload,
} from '@/features/customers/constants';
import useCreateCustomer from '@/features/customers/hooks/useCreateCustomer';
import useUpdateCustomer from '@/features/customers/hooks/useUpdateCustomer';

const FORM_ID = 'customer-modal-form';

function StarIcon({ filled }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

StarIcon.propTypes = { filled: PropTypes.bool };

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const activeMutation = customer ? updateMutation : createMutation;

  const [name, setName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [contacts, setContacts] = useState([createEmptyContact(true)]);
  const [nameError, setNameError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [contactModal, setContactModal] = useState(null); // { index: number | null }

  useEffect(() => {
    if (!isOpen) return;
    setName(customer?.name ?? '');
    setCompanyNumber(customer?.companyNumber ?? '');
    setContacts(
      customer?.contacts?.length
        ? customer.contacts.map((c, i) => ({
            email: c.email ?? '',
            phone: c.phone ?? '',
            address: c.address ?? '',
            isPrimary: Boolean(c.isPrimary) || i === 0,
          }))
        : [createEmptyContact(true)]
    );
    setNameError('');
    setContactsError('');
    setSubmitError('');
    setContactModal(null);
    createMutation.reset();
    updateMutation.reset();
  }, [customer, isOpen]);

  const dialogTitle = customer ? CUSTOMER_TEXT.modal.editTitle : CUSTOMER_TEXT.modal.createTitle;
  const submitLabel = customer ? CUSTOMER_TEXT.modal.editSubmit : CUSTOMER_TEXT.modal.createSubmit;
  const isSaving = activeMutation.isLoading || activeMutation.isPending;

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {CUSTOMER_TEXT.modal.cancel}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {submitLabel}
        </Button>
      </>
    ),
    [isSaving, onClose, submitLabel]
  );

  const setPrimary = (index) => {
    setContacts((prev) => prev.map((c, i) => ({ ...c, isPrimary: i === index })));
  };

  const removeContact = (index) => {
    setContacts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.length) return [createEmptyContact(true)];
      // if removed was primary, assign primary to first
      if (!next.some((c) => c.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  };

  const openAddContact = () => setContactModal({ index: null });
  const openEditContact = (index) => setContactModal({ index });
  const closeContactModal = () => setContactModal(null);

  const handleContactSave = (data) => {
    if (contactModal.index === null) {
      // add new — not primary unless it's the first
      setContacts((prev) => [...prev, { ...data, isPrimary: prev.length === 0 }]);
    } else {
      setContacts((prev) =>
        prev.map((c, i) => (i === contactModal.index ? { ...data, isPrimary: c.isPrimary } : c))
      );
    }
    setContactModal(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(CUSTOMER_TEXT.modal.nameRequired);
      setSubmitError('');
      return;
    }
    setNameError('');
    setSubmitError('');
    const payload = normalizeCustomerPayload({ name: trimmedName, companyNumber, contacts });
    // A customer must have at least one contact with details.
    if (!payload.contacts.length) {
      setContactsError(CUSTOMER_TEXT.modal.contactsRequired);
      return;
    }
    setContactsError('');
    const onError = (error) => {
      const message = getApiErrorMessage(error, CUSTOMER_TEXT.modal.saveError);
      if (error?.response?.status === 409) { setNameError(message); return; }
      setSubmitError(message);
    };
    const mutationOptions = {
      onSuccess: (saved) => {
        onSuccess(
          customer
            ? CUSTOMER_TEXT.success.updated(saved?.name ?? trimmedName)
            : CUSTOMER_TEXT.success.created(saved?.name ?? trimmedName)
        );
        onClose();
      },
      onError,
    };
    if (customer) { updateMutation.mutate({ id: customer.id, data: payload }, mutationOptions); return; }
    createMutation.mutate(payload, mutationOptions);
  };

  const editingContact = contactModal?.index !== null && contactModal?.index !== undefined
    ? contacts[contactModal.index]
    : null;

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle} footer={footer}>
        <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
          <FormField label={CUSTOMER_TEXT.modal.nameLabel}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={CUSTOMER_TEXT.modal.namePlaceholder}
              aria-invalid={Boolean(nameError)}
            />
          </FormField>
          {nameError && <p className="-mt-3 text-xs font-medium text-rose-600">{nameError}</p>}

          <FormField label={CUSTOMER_TEXT.modal.companyNumberLabel}>
            <Input
              value={companyNumber}
              onChange={(e) => setCompanyNumber(e.target.value)}
              placeholder={CUSTOMER_TEXT.modal.companyNumberPlaceholder}
            />
          </FormField>

          {/* Contacts grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{CUSTOMER_TEXT.modal.contactsLabel}</h3>
              <Button type="button" variant="ghost" onClick={openAddContact}>
                {CUSTOMER_TEXT.modal.addContact}
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              {contacts.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No contacts yet.</p>
              ) : (
                <table className="w-full text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-400 uppercase tracking-wide">
                    <tr>
                      <th className="w-8 px-3 py-2 text-center">Primary</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="w-16 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {contacts.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPrimary(i)}
                            className={`transition-colors ${c.isPrimary ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                            aria-label={c.isPrimary ? 'Primary contact' : 'Set as primary'}
                            title={c.isPrimary ? 'Primary contact' : 'Set as primary'}
                          >
                            <StarIcon filled={c.isPrimary} />
                          </button>
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-slate-700">
                          {c.email || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {c.phone || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditContact(i)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              aria-label="Edit contact"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeContact(i)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                              aria-label="Remove contact"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {contactsError && <p className="text-xs font-medium text-rose-600">{contactsError}</p>}
          </div>

          {submitError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {submitError}
            </p>
          )}
        </Form>
      </Dialog>

      <ContactModal
        isOpen={contactModal !== null}
        onClose={closeContactModal}
        contact={editingContact}
        onSave={handleContactSave}
      />
    </>
  );
}

CustomerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    contacts: PropTypes.arrayOf(
      PropTypes.shape({
        email: PropTypes.string,
        phone: PropTypes.string,
        address: PropTypes.string,
        isPrimary: PropTypes.bool,
      })
    ),
  }),
  onSuccess: PropTypes.func.isRequired,
};
