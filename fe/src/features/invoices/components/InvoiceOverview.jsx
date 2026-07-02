import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
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
import ReceiptDetailModal from '@/features/receipts/components/ReceiptDetailModal';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : INVOICE_TEXT.placeholder);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const STATUS_BADGE = {
  draft: { bg: '#e0e7ff', color: '#3730a3' },
  sent: { bg: '#fef3c7', color: '#92400e' },
  paid: { bg: '#d1fae5', color: '#065f46' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

function buildEmailHtml(invoice) {
  const badge = STATUS_BADGE[invoice.status] ?? { bg: '#f1f5f9', color: '#475569' };
  const statusLabel = INVOICE_TEXT.status[invoice.status] ?? invoice.status;

  const subtotal = parseFloat(invoice.subtotal ?? 0);
  const discountAmount = parseFloat(invoice.discountAmount ?? 0);
  const taxRate = parseFloat(invoice.taxRate ?? 0);
  const taxAmount = parseFloat(invoice.taxAmount ?? 0);
  const total = parseFloat(invoice.total ?? 0);

  const lineItemsHtml = (invoice.lineItems ?? [])
    .map((item) => {
      const tagStyle =
        item.sourceType === 'contract'
          ? 'background:#dbeafe;color:#1d4ed8;'
          : item.sourceType === 'expense'
            ? 'background:#fef3c7;color:#92400e;'
            : '';
      const tagHtml = item.sourceType
        ? `<span style="font-size:11px;padding:2px 8px;border-radius:4px;${tagStyle}">${item.sourceType}</span>`
        : '';
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.75rem 0;border-bottom:1px solid #f0f0f0;">
        <div>
          <div style="font-size:14px;color:#222;margin-bottom:4px;">${item.description}</div>
          ${tagHtml}
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;color:#222;">${formatAmount(item.amount, invoice.currency)}</div>
          <div style="font-size:12px;color:#aaa;">${parseFloat(item.quantity).toFixed(2)} × ${parseFloat(item.unitPrice).toFixed(2)}</div>
        </div>
      </div>`;
    })
    .join('');

  const discountHtml =
    discountAmount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
          <span style="color:#666;">${invoice.discountType === 'percentage' ? `Discount (${parseFloat(invoice.discountValue)}%)` : 'Discount'}</span>
          <span style="color:#dc2626;">−${formatAmount(discountAmount.toFixed(2), invoice.currency)}</span>
        </div>`
      : '';

  const taxHtml =
    taxRate > 0
      ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
          <span style="color:#666;">Tax (${taxRate}%)</span>
          <span>${formatAmount(taxAmount.toFixed(2), invoice.currency)}</span>
        </div>`
      : '';

  const lineItemsSection = lineItemsHtml
    ? `<div style="padding:1.25rem 2rem;border-bottom:1px solid #e0e0e0;">
        <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:1rem;">Line items</div>
        ${lineItemsHtml}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:2rem;margin:0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;border:1px solid #e0e0e0;overflow:hidden;">

    <div style="padding:2rem;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:22px;font-weight:600;margin-bottom:4px;">${invoice.invoiceNumber}</div>
        <div style="font-size:13px;color:#888;">Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}</div>
      </div>
      <span style="background:${badge.bg};color:${badge.color};font-size:12px;font-weight:600;padding:4px 12px;border-radius:6px;">${statusLabel}</span>
    </div>

    <div style="padding:1.25rem 2rem;border-bottom:1px solid #e0e0e0;display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div>
        <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Customer</div>
        <div style="font-size:14px;color:#222;">${invoice.customerName ?? '—'}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Contract type</div>
        <div style="font-size:14px;color:#222;">${invoice.contractTypeLabel ?? '—'}</div>
      </div>
    </div>

    ${lineItemsSection}

    <div style="padding:1.25rem 2rem;border-bottom:1px solid #e0e0e0;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
        <span style="color:#666;">Subtotal</span>
        <span>${formatAmount(subtotal.toFixed(2), invoice.currency)}</span>
      </div>
      ${discountHtml}
      ${taxHtml}
    </div>

    <div style="padding:1.25rem 2rem;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:15px;font-weight:600;">Total</span>
      <span style="font-size:24px;font-weight:700;">${formatAmount(total.toFixed(2), invoice.currency)}</span>
    </div>

  </div>
</body>
</html>`;
}

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
  const [emailLabel, setEmailLabel] = useState('Send Email');
  const [showReceipt, setShowReceipt] = useState(false);
  const resetRef = useRef(null);

  const handleSendEmail = async () => {
    if (!invoice) return;
    const html = buildEmailHtml(invoice);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) }),
      ]);
    } catch {
      // fallback: plain text copy so the button still works
      await navigator.clipboard.writeText(html).catch(() => {});
    }
    const to = encodeURIComponent(invoice.customerEmail ?? '');
    const su = encodeURIComponent(`Invoice ID: ${invoice.invoiceNumber}`);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}`,
      '_blank',
      'noopener,noreferrer'
    );
    setEmailLabel('Paste in Gmail (⌘V)');
    clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setEmailLabel('Send Email'), 4000);
  };

  useEffect(() => () => clearTimeout(resetRef.current), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const receiptModal = showReceipt && invoice?.receiptId ? (
    <ReceiptDetailModal receiptId={invoice.receiptId} onClose={() => setShowReceipt(false)} />
  ) : null;

  const subtotal = invoice ? parseFloat(invoice.subtotal ?? 0) : 0;
  const discountAmount = invoice ? parseFloat(invoice.discountAmount ?? 0) : 0;
  const discountType = invoice?.discountType ?? null;
  const discountValue = invoice?.discountValue ?? null;
  const taxAmount = invoice ? parseFloat(invoice.taxAmount ?? 0) : 0;
  const total = invoice ? parseFloat(invoice.total ?? 0) : 0;
  const taxRate = invoice ? parseFloat(invoice.taxRate ?? 0) : 0;

  return (
    <>
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
          <div className="flex items-center gap-2">
            {invoice?.status === 'paid' && invoice?.receiptId ? (
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                onClick={() => setShowReceipt(true)}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Receipt
              </Button>
            ) : null}
            {invoice ? (
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                onClick={handleSendEmail}
                aria-label="Send invoice by email"
              >
                <MailIcon />
                {emailLabel}
              </Button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
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
                      <TableHeader>Qty</TableHeader>
                      <TableHeader>Unit Price</TableHeader>
                      <TableHeader>Amount</TableHeader>
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
                        <TableCell className="tabular-nums">
                          {parseFloat(item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {parseFloat(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
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
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>
                      {/* eslint-disable-next-line react/prop-types */}
                      {invoice.discountType === 'percentage'
                        ? `Discount (${parseFloat(invoice.discountValue)}%)`
                        : 'Discount'}
                    </span>
                    <span className="tabular-nums">
                      − {formatAmount(discountAmount.toFixed(2), invoice.currency)}
                    </span>
                  </div>
                ) : null}
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
    {receiptModal}
    </>
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
