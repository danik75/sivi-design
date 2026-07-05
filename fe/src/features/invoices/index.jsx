import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import useTransitionStatus from '@/features/invoices/hooks/useTransitionStatus';
import AddReceiptModal from '@/features/receipts/components/AddReceiptModal';
import InvoiceDeleteDialog from './components/InvoiceDeleteDialog';
import InvoiceGrid from './components/InvoiceGrid';
import InvoiceModal from './components/InvoiceModal';
import { getApiErrorMessage, INVOICE_TEXT } from './constants';

export default function InvoicesFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [viewInvoiceId, setViewInvoiceId] = useState(null);
  const transitionMutation = useTransitionStatus();

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setEditInvoice(null);
    setDeleteInvoice(null);
  };

  const handleStatusTransition = (invoice, targetStatus) => {
    if (targetStatus === 'paid') {
      setReceiptInvoice(invoice);
      return;
    }
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
        selectedInvoiceId={viewInvoiceId}
        onSelectInvoice={setViewInvoiceId}
      />
      <InvoiceModal
        isOpen={showCreate || Boolean(editInvoice)}
        onClose={() => {
          setShowCreate(false);
          setEditInvoice(null);
        }}
        invoice={editInvoice}
        onSuccess={handleSuccess}
        onView={(saved) => setViewInvoiceId(saved.id)}
      />
      <InvoiceDeleteDialog
        isOpen={Boolean(deleteInvoice)}
        onClose={() => setDeleteInvoice(null)}
        invoice={deleteInvoice}
        onSuccess={handleSuccess}
      />
      {receiptInvoice && (
        <AddReceiptModal
          invoice={receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
          onSuccess={(saved) => {
            setReceiptInvoice(null);
            showToast(`Receipt ${saved.receiptNumber} saved — invoice marked as paid.`, 'success');
          }}
        />
      )}
    </>
  );
}

InvoicesFeature.propTypes = {};
