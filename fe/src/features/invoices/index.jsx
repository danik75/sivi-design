import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import useTransitionStatus from '@/features/invoices/hooks/useTransitionStatus';
import InvoiceDeleteDialog from './components/InvoiceDeleteDialog';
import InvoiceGrid from './components/InvoiceGrid';
import InvoiceModal from './components/InvoiceModal';
import { getApiErrorMessage, INVOICE_TEXT } from './constants';

export default function InvoicesFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const transitionMutation = useTransitionStatus();

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setEditInvoice(null);
    setDeleteInvoice(null);
  };

  const handleStatusTransition = (invoice, targetStatus) => {
    transitionMutation.mutate(
      { id: invoice.id, status: targetStatus },
      {
        onSuccess: (saved) =>
          showToast(
            INVOICE_TEXT.success.statusChanged(saved.invoiceNumber, saved.status),
            'success'
          ),
        onError: (error) =>
          showToast(getApiErrorMessage(error, INVOICE_TEXT.statusChangeError), 'error'),
      }
    );
  };

  return (
    <>
      <InvoiceGrid
        onCreate={() => setShowCreate(true)}
        onEdit={(invoice) => setEditInvoice(invoice)}
        onDelete={(invoice) => setDeleteInvoice(invoice)}
        onStatusTransition={handleStatusTransition}
      />
      <InvoiceModal
        isOpen={showCreate || Boolean(editInvoice)}
        onClose={() => {
          setShowCreate(false);
          setEditInvoice(null);
        }}
        invoice={editInvoice}
        onSuccess={handleSuccess}
      />
      <InvoiceDeleteDialog
        isOpen={Boolean(deleteInvoice)}
        onClose={() => setDeleteInvoice(null)}
        invoice={deleteInvoice}
        onSuccess={handleSuccess}
      />
    </>
  );
}

InvoicesFeature.propTypes = {};
