import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import XIcon from '@/components/chadcn/icons/XIcon';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', address: '' };

export default function ContactModal({ isOpen, onClose, contact, onSave }) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFields({
      firstName: contact?.firstName ?? '',
      lastName: contact?.lastName ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      address: contact?.address ?? '',
    });
    setError('');
  }, [isOpen, contact]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = (field) => (e) => setFields((f) => ({ ...f, [field]: e.target.value }));

  function handleSave() {
    if (!fields.email.trim() && !fields.phone.trim()) {
      setError('Email or phone is required.');
      return;
    }
    onSave({
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      address: fields.address.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={contact ? 'Edit Contact' : 'Add Contact'}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First name">
              <Input
                value={fields.firstName}
                onChange={set('firstName')}
                placeholder="First name"
                autoFocus
              />
            </FormField>
            <FormField label="Last name">
              <Input value={fields.lastName} onChange={set('lastName')} placeholder="Last name" />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={fields.email}
              onChange={set('email')}
              placeholder="name@company.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={fields.phone}
              onChange={set('phone')}
              placeholder="+1 555 000 0000"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={fields.address}
              onChange={set('address')}
              placeholder="Street, city, country"
            />
          </FormField>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave}>
            {contact ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </div>
    </div>
  );
}

ContactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  contact: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
};
