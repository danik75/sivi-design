import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Form from '@/components/chadcn/Form';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import XIcon from '@/components/chadcn/icons/XIcon';
import {
  CUSTOMER_TEXT,
  createEmptyContact,
  getApiErrorMessage,
  normalizeCustomerPayload,
} from '@/features/customers/constants';
import useCreateCustomer from '@/features/customers/hooks/useCreateCustomer';
import useUpdateCustomer from '@/features/customers/hooks/useUpdateCustomer';

const FORM_ID = 'customer-modal-form';
const T = CUSTOMER_TEXT.modal;

function StarIcon({ filled }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

StarIcon.propTypes = { filled: PropTypes.bool };

function SectionTitle({ children, hint }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
      <h3 className="text-sm font-semibold text-slate-800">{children}</h3>
      {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
    </div>
  );
}

SectionTitle.propTypes = { children: PropTypes.node, hint: PropTypes.string };

function mapContact(c, i) {
  return {
    name: c.name ?? '',
    title: c.title ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    isPrimary: Boolean(c.isPrimary) || i === 0,
  };
}

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const activeMutation = customer ? updateMutation : createMutation;

  const [fields, setFields] = useState({
    name: '',
    title: '',
    companyName: '',
    companyNumber: '',
    companyPhone: '',
    companyEmail: '',
    address: '',
  });
  const [contacts, setContacts] = useState([createEmptyContact(true)]);
  const [nameError, setNameError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFields({
      name: customer?.name ?? '',
      title: customer?.title ?? '',
      companyName: customer?.companyName ?? '',
      companyNumber: customer?.companyNumber ?? '',
      companyPhone: customer?.companyPhone ?? '',
      companyEmail: customer?.companyEmail ?? '',
      address: customer?.address ?? '',
    });
    setContacts(
      customer?.contacts?.length ? customer.contacts.map(mapContact) : [createEmptyContact(true)]
    );
    setNameError('');
    setContactsError('');
    setSubmitError('');
    createMutation.reset();
    updateMutation.reset();
  }, [customer, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSaving = activeMutation.isLoading || activeMutation.isPending;
  const set = (field) => (e) => setFields((f) => ({ ...f, [field]: e.target.value }));

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {T.cancel}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={isSaving}>
          {customer ? T.editSubmit : T.createSubmit}
        </Button>
      </>
    ),
    [isSaving, onClose, customer]
  );

  const setContactField = (index, field, value) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    if (contactsError) setContactsError('');
  };
  const setPrimary = (index) =>
    setContacts((prev) => prev.map((c, i) => ({ ...c, isPrimary: i === index })));
  const addContact = () => setContacts((prev) => [...prev, createEmptyContact(prev.length === 0)]);
  const removeContact = (index) =>
    setContacts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.length) return [createEmptyContact(true)];
      if (!next.some((c) => c.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return next;
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = fields.name.trim();
    if (!trimmedName) {
      setNameError(T.nameRequired);
      setSubmitError('');
      return;
    }
    setNameError('');
    setSubmitError('');

    const payload = normalizeCustomerPayload({ ...fields, name: trimmedName, contacts });
    if (!payload.contacts.length) {
      setContactsError(T.contactsRequired);
      return;
    }
    setContactsError('');

    const onError = (error) => {
      const message = getApiErrorMessage(error, T.saveError);
      if (error?.response?.status === 409) {
        setNameError(message);
        return;
      }
      setSubmitError(message);
    };
    const options = {
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
    if (customer) updateMutation.mutate({ id: customer.id, data: payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? T.editTitle : T.createTitle}
      footer={footer}
      size="xl"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <Form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <div className="space-y-3">
            <SectionTitle>{T.customerSection}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={T.nameLabel}>
                <Input
                  value={fields.name}
                  onChange={set('name')}
                  placeholder={T.namePlaceholder}
                  aria-invalid={Boolean(nameError)}
                />
                {nameError ? <p className="text-xs font-medium text-rose-600">{nameError}</p> : null}
              </FormField>
              <FormField label={T.titleLabel}>
                <Input value={fields.title} onChange={set('title')} placeholder={T.titlePlaceholder} />
              </FormField>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <SectionTitle hint={T.companyHint}>{T.companySection}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={T.companyNameLabel}>
                <Input value={fields.companyName} onChange={set('companyName')} placeholder={T.companyNamePlaceholder} />
              </FormField>
              <FormField label={T.companyNumberLabel}>
                <Input value={fields.companyNumber} onChange={set('companyNumber')} placeholder={T.companyNumberPlaceholder} />
              </FormField>
              <FormField label={T.companyPhoneLabel}>
                <Input value={fields.companyPhone} onChange={set('companyPhone')} placeholder={T.companyPhonePlaceholder} />
              </FormField>
              <FormField label={T.companyEmailLabel}>
                <Input type="email" value={fields.companyEmail} onChange={set('companyEmail')} placeholder={T.companyEmailPlaceholder} />
              </FormField>
            </div>
            <FormField label={T.addressLabel}>
              <Input value={fields.address} onChange={set('address')} placeholder={T.addressPlaceholder} />
            </FormField>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{T.contactsLabel}</h3>
                <span className="text-xs font-normal text-slate-400">{T.contactsHint}</span>
              </div>
              <Button type="button" variant="ghost" onClick={addContact}>
                {T.addContact}
              </Button>
            </div>

            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPrimary(i)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        c.isPrimary ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'
                      }`}
                      title={c.isPrimary ? 'Primary contact' : 'Set as primary'}
                    >
                      <StarIcon filled={c.isPrimary} />
                      {c.isPrimary ? 'Primary' : 'Set as primary'}
                    </button>
                    {contacts.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        aria-label="Remove contact"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label={T.contactNameLabel}>
                      <Input
                        value={c.name}
                        onChange={(e) => setContactField(i, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </FormField>
                    <FormField label={T.contactTitleLabel}>
                      <Input
                        value={c.title}
                        onChange={(e) => setContactField(i, 'title', e.target.value)}
                        placeholder="Role"
                      />
                    </FormField>
                    <FormField label={T.contactPhoneLabel}>
                      <Input
                        value={c.phone}
                        onChange={(e) => setContactField(i, 'phone', e.target.value)}
                        placeholder="+972 …"
                      />
                    </FormField>
                    <FormField label={T.contactEmailLabel}>
                      <Input
                        type="email"
                        value={c.email}
                        onChange={(e) => setContactField(i, 'email', e.target.value)}
                        placeholder="name@company.com"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
            {contactsError ? (
              <p className="text-xs font-medium text-rose-600">{contactsError}</p>
            ) : null}
          </div>

          {submitError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {submitError}
            </p>
          ) : null}
        </Form>
      </div>
    </Dialog>
  );
}

CustomerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
    companyName: PropTypes.string,
    companyNumber: PropTypes.string,
    companyPhone: PropTypes.string,
    companyEmail: PropTypes.string,
    address: PropTypes.string,
    contacts: PropTypes.arrayOf(PropTypes.object),
  }),
  onSuccess: PropTypes.func.isRequired,
};
