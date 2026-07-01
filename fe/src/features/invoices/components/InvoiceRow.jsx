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

const EyeIcon = ({ className = 'h-4 w-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

EyeIcon.propTypes = { className: PropTypes.string };

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : INVOICE_TEXT.placeholder);

export default function InvoiceRow({
  invoice,
  onEdit,
  onDelete,
  onStatusTransition,
  onView,
  isSelected,
}) {
  const contractLabel = invoice.contractTypeLabel || INVOICE_TEXT.placeholder;
  const statusLabel = INVOICE_TEXT.status[invoice.status] || INVOICE_TEXT.placeholder;

  return (
    <TableRow className={isSelected ? 'bg-indigo-50' : undefined}>
      <TableCell
        className={`font-mono font-semibold cursor-pointer ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}
        onClick={() => onView(invoice)}
      >
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
          <Button
            type="button"
            variant="ghost"
            className="p-2"
            onClick={() => onView(invoice)}
            aria-label="View invoice"
          >
            <EyeIcon />
          </Button>
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
  onView: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
};

InvoiceRow.defaultProps = {
  isSelected: false,
};
