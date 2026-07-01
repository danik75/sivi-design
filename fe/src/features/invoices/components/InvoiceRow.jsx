import PropTypes from 'prop-types';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
import PencilIcon from '@/components/chadcn/icons/PencilIcon';
import TrashIcon from '@/components/chadcn/icons/TrashIcon';
import { TableCell, TableRow } from '@/components/chadcn/Table';
import {
  formatAmount,
  getStatusVariant,
  INVOICE_TEXT,
  isEditable,
} from '@/features/invoices/constants';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : INVOICE_TEXT.placeholder);

export default function InvoiceRow({ invoice, onEdit, onDelete, onStatusTransition }) {
  const contractLabel = invoice.contractTypeLabel || INVOICE_TEXT.placeholder;
  const statusLabel = INVOICE_TEXT.status[invoice.status] || INVOICE_TEXT.placeholder;

  return (
    <TableRow>
      <TableCell className="font-mono font-semibold text-slate-900">
        {invoice.invoiceNumber}
      </TableCell>
      <TableCell>{invoice.customerName || INVOICE_TEXT.placeholder}</TableCell>
      <TableCell>{contractLabel}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(invoice.status)}>{statusLabel}</Badge>
      </TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell>{formatAmount(invoice.total, invoice.currency)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {isEditable(invoice.status) ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className="p-2"
                onClick={() => onEdit(invoice)}
                aria-label={INVOICE_TEXT.rowActions.editLabel}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="danger"
                className="p-2"
                onClick={() => onDelete(invoice)}
                aria-label={INVOICE_TEXT.rowActions.deleteLabel}
              >
                <TrashIcon />
              </Button>
            </>
          ) : null}
          {invoice.status === 'draft' ? (
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-2"
              onClick={() => onStatusTransition(invoice, 'sent')}
            >
              {INVOICE_TEXT.rowActions.markSent}
            </Button>
          ) : null}
          {invoice.status === 'sent' ? (
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-2"
              onClick={() => onStatusTransition(invoice, 'paid')}
            >
              {INVOICE_TEXT.rowActions.markPaid}
            </Button>
          ) : null}
          {invoice.status === 'draft' || invoice.status === 'sent' ? (
            <Button
              type="button"
              variant="danger"
              className="px-3 py-2"
              onClick={() => onStatusTransition(invoice, 'cancelled')}
            >
              {INVOICE_TEXT.rowActions.cancel}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

InvoiceRow.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string.isRequired,
    customerName: PropTypes.string,
    contractTypeLabel: PropTypes.string,
    status: PropTypes.string.isRequired,
    issueDate: PropTypes.string,
    dueDate: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusTransition: PropTypes.func.isRequired,
};
