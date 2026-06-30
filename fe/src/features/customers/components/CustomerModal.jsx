import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import ContactCard from '@/features/customers/components/ContactCard';
import {
  CUSTOMER_TEXT,
  createEmptyContact,
  getApiErrorMessage,
  normalizeCustomerPayload,
} from '@/features/customers/constants';
import useCreateCustomer from '@/features/customers/hooks/useCreateCustomer';
import useUpdateCustomer from '@/features/customers/hooks/useUpdateCustomer';

const FORM_ID = 'customer-modal-form';

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const activeMutation = customer ? updateMutation : createMutation;
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState([createEmptyContact()]);
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(customer?.name ?? '');
    setContacts(
      customer?.contacts?.length
        ? customer.contacts.map((contact) => ({
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            address: contact.address ?? '',
          }))
        : [createEmptyContact()]
    );
    setNameError('');
    setSubmitError('');
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

  const handleContactChange = (index, field, value) => {
    setContacts((current) =>
      current.map((contact, currentIndex) =>
        currentIndex === index ? { ...contact, [field]: value } : contact
      )
    );
  };

  const handleRemoveContact = (index) => {
    setContacts((current) => {
      const nextContacts = current.filter((_, currentIndex) => currentIndex !== index);
      return nextContacts.length ? nextContacts : [createEmptyContact()];
    });
  };

  const handleAddContact = () => {
    setContacts((current) => [...current, createEmptyContact()]);
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
    const payload = normalizeCustomerPayload({ name: trimmedName, contacts });
    const onError = (error) => {
      const message = getApiErrorMessage(error, CUSTOMER_TEXT.modal.saveError);
      if (error?.response?.status === 409) {
        setNameError(message);
        return;
      }
      setSubmitError(message);
    };
    const mutationOptions = {
      onSuccess: (savedCustomer) => {
        onSuccess(
          customer
            ? CUSTOMER_TEXT.success.updated(savedCustomer?.name ?? trimmedName)
            : CUSTOMER_TEXT.success.created(savedCustomer?.name ?? trimmedName)
        );
        onClose();
      },
      onError,
    };

    if (customer) {
      updateMutation.mutate({ id: customer.id, data: payload }, mutationOptions);
      return;
    }

    createMutation.mutate(payload, mutationOptions);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle} footer={footer}>
      <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        <FormField label={CUSTOMER_TEXT.modal.nameLabel}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={CUSTOMER_TEXT.modal.namePlaceholder}
            aria-invalid={Boolean(nameError)}
          />
        </FormField>
        {nameError ? <p className="-mt-3 text-xs font-medium text-rose-600">{nameError}</p> : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {CUSTOMER_TEXT.modal.contactsLabel}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{CUSTOMER_TEXT.modal.contactsHint}</p>
            </div>
            <Button type="button" variant="ghost" onClick={handleAddContact}>
              {CUSTOMER_TEXT.modal.addContact}
            </Button>
          </div>

          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <ContactCard
                key={`contact-${index}`}
                contact={contact}
                index={index}
                onChange={handleContactChange}
                onRemove={handleRemoveContact}
              />
            ))}
          </div>
        </div>

        {submitError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {submitError}
          </p>
        ) : null}
      </Form>
    </Dialog>
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
      })
    ),
  }),
  onSuccess: PropTypes.func.isRequired,
};
