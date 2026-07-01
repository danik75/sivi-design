import PropTypes from 'prop-types';
import { useEffect } from 'react';
import Badge from '@/components/chadcn/Badge';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import XIcon from '@/components/chadcn/icons/XIcon';
import { formatAmount, getStatusVariant, INVOICE_TEXT } from '@/features/invoices/constants';
import useInvoice from '@/features/invoices/hooks/useInvoice';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : INVOICE_TEXT.placeholder);

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{value || INVOICE_TEXT.placeholder}</span>
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function InvoiceOverview({ isOpen, invoiceId, onClose }) {
  const { data: invoice, isLoading, isError } = useInvoice(isOpen ? invoiceId : null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const subtotal = invoice ? parseFloat(invoice.subtotal ?? 0) : 0;
  const taxAmount = invoice ? parseFloat(invoice.taxAmount ?? 0) : 0;
  const total = invoice ? parseFloat(invoice.total ?? 0) : 0;
  const taxRate = invoice ? parseFloat(invoice.taxRate ?? 0) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl mb-12"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {invoice ? (
              <>
                <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {INVOICE_TEXT.status[invoice.status] ?? invoice.status}
                </Badge>
              </>
            ) : (
              <span className="text-lg font-semibold text-slate-900">Invoice Details</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Loading…</div>
        ) : isError ? (
          <div className="px-6 py-16 text-center text-sm text-rose-600">
            Unable to load invoice.
          </div>
        ) : invoice ? (
          <div className="divide-y divide-slate-100">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Customer" value={invoice.customerName} />
              <Field label="Contract" value={invoice.contractTypeLabel} />
              <Field label="Issue Date" value={formatDate(invoice.issueDate)} />
              <Field label="Due Date" value={formatDate(invoice.dueDate)} />
              <Field label="Currency" value={invoice.currency} />
              <Field label="Tax Rate" value={taxRate > 0 ? `${taxRate}%` : '—'} />
              <Field label="Created" value={formatDate(invoice.createdAt)} />
              {invoice.notes ? (
                <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3 lg:col-span-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </span>
                  <p className="text-sm text-slate-800 whitespace-pre-line">{invoice.notes}</p>
                </div>
              ) : null}
            </div>

            {/* Line items */}
            <div className="px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Line Items
              </p>
              {invoice.lineItems?.length ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Source</TableHeader>
                      <TableHeader className="text-right">Qty</TableHeader>
                      <TableHeader className="text-right">Unit Price</TableHeader>
                      <TableHeader className="text-right">Amount</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-slate-800">{item.description}</TableCell>
                        <TableCell>
                          {item.sourceType ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 capitalize">
                              {item.sourceType}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {parseFloat(item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {parseFloat(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatAmount(item.amount, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-400">No line items.</p>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end px-6 py-5">
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatAmount(subtotal.toFixed(2), invoice.currency)}
                  </span>
                </div>
                {taxRate > 0 ? (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax ({taxRate}%)</span>
                    <span className="tabular-nums">
                      {formatAmount(taxAmount.toFixed(2), invoice.currency)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatAmount(total.toFixed(2), invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

InvoiceOverview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  invoiceId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

InvoiceOverview.defaultProps = {
  invoiceId: null,
};
