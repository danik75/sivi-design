import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import { CUSTOMER_TEXT, getApiErrorMessage } from '@/features/customers/constants';
import useDeleteCustomer from '@/features/customers/hooks/useDeleteCustomer';

export default function CustomerDeleteDialog({ isOpen, onClose, customer, onSuccess }) {
  const deleteMutation = useDeleteCustomer();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeleting = deleteMutation.isLoading || deleteMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deleteMutation.reset();
    }
  }, [isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {CUSTOMER_TEXT.deleteDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            if (!customer?.id) {
              return;
            }

            setErrorMessage('');
            deleteMutation.mutate(customer.id, {
              onSuccess: () => {
                onSuccess(CUSTOMER_TEXT.success.deleted(customer.name));
                onClose();
              },
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, CUSTOMER_TEXT.deleteDialog.error)),
            });
          }}
          disabled={isDeleting || !customer?.id}
        >
          {CUSTOMER_TEXT.deleteDialog.confirm}
        </Button>
      </>
    ),
    [customer, deleteMutation, isDeleting, onClose, onSuccess]
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={CUSTOMER_TEXT.deleteDialog.title}
      footer={footer}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {CUSTOMER_TEXT.deleteDialog.description(customer?.name ?? '')}
        </p>
        {errorMessage ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

CustomerDeleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};
