import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import { getApiErrorMessage, INVOICE_TEXT } from '@/features/invoices/constants';
import useDeleteInvoice from '@/features/invoices/hooks/useDeleteInvoice';

export default function InvoiceDeleteDialog({ isOpen, onClose, invoice, onSuccess }) {
  const deleteMutation = useDeleteInvoice();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeleting = deleteMutation.isLoading || deleteMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deleteMutation.reset();
    }
  }, [deleteMutation, isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {INVOICE_TEXT.deleteDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeleting || !invoice?.id}
          onClick={() => {
            if (!invoice?.id) {
              return;
            }

            setErrorMessage('');
            deleteMutation.mutate(invoice.id, {
              onSuccess: () => {
                onSuccess(INVOICE_TEXT.success.deleted(invoice.invoiceNumber));
                onClose();
              },
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, INVOICE_TEXT.deleteDialog.error)),
            });
          }}
        >
          {INVOICE_TEXT.deleteDialog.confirm}
        </Button>
      </>
    ),
    [deleteMutation, invoice, isDeleting, onClose, onSuccess]
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={INVOICE_TEXT.deleteDialog.title}
      footer={footer}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {INVOICE_TEXT.deleteDialog.description(invoice?.invoiceNumber ?? '')}
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

InvoiceDeleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoice: PropTypes.shape({
    id: PropTypes.string,
    invoiceNumber: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

InvoiceDeleteDialog.defaultProps = {
  invoice: null,
};
