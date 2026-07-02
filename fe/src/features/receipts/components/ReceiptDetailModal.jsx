import PropTypes from 'prop-types';
import { useEffect } from 'react';
import useReceipt from '../hooks/useReceipt';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(amount, currency) {
  if (amount == null) return '—';
  return `${parseFloat(amount).toFixed(2)} ${currency ?? ''}`.trim();
}

function FilePreview({ fileData, fileMimeType, fileName }) {
  if (!fileData) {
    return <p className="text-sm text-slate-400 italic">No attachment</p>;
  }

  const dataUrl = `data:${fileMimeType};base64,${fileData}`;
  const isImage = fileMimeType?.startsWith('image/');
  const isPdf = fileMimeType === 'application/pdf';

  function handleDownload() {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName ?? 'receipt';
    a.click();
  }

  return (
    <div className="space-y-3">
      {isImage && (
        <img
          src={dataUrl}
          alt={fileName}
          className="max-h-64 w-full rounded-lg border border-slate-100 object-contain bg-slate-50"
        />
      )}
      {isPdf && (
        <embed
          src={dataUrl}
          type="application/pdf"
          className="h-64 w-full rounded-lg border border-slate-100"
        />
      )}
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {fileName ?? 'Download file'}
      </button>
    </div>
  );
}

FilePreview.propTypes = {
  fileData: PropTypes.string,
  fileMimeType: PropTypes.string,
  fileName: PropTypes.string,
};

export default function ReceiptDetailModal({ receiptId, onClose }) {
  const { data: receipt, isLoading, isError } = useReceipt(receiptId);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-slate-900">Receipt Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />)}
            </div>
          )}

          {isError && <p className="text-sm text-rose-600">Unable to load receipt.</p>}

          {receipt && (
            <>
              {/* Receipt info */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Receipt</p>
                <div className="space-y-2">
                  <Row label="Receipt number" value={receipt.receiptNumber} mono />
                  <Row label="Paid on" value={fmtDate(receipt.paidAt)} />
                </div>
              </section>

              {/* Invoice info */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice</p>
                <div className="space-y-2">
                  <Row label="Invoice number" value={receipt.invoiceNumber} mono />
                  <Row label="Customer" value={receipt.customerName ?? '—'} />
                  <Row label="Issue date" value={fmtDate(receipt.issueDate)} />
                  <Row label="Due date" value={fmtDate(receipt.dueDate)} />
                  {receipt.subtotal != null && (
                    <Row label="Subtotal" value={fmtMoney(receipt.subtotal, receipt.currency)} />
                  )}
                  {receipt.taxAmount != null && parseFloat(receipt.taxAmount) > 0 && (
                    <Row label="Tax" value={fmtMoney(receipt.taxAmount, receipt.currency)} />
                  )}
                  <Row
                    label="Total"
                    value={fmtMoney(receipt.total, receipt.currency)}
                    highlight
                  />
                </div>
              </section>

              {/* File attachment */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Attachment</p>
                <FilePreview
                  fileData={receipt.fileData}
                  fileMimeType={receipt.fileMimeType}
                  fileName={receipt.fileName}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, highlight }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-slate-900' : 'text-slate-700'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  mono: PropTypes.bool,
  highlight: PropTypes.bool,
};

ReceiptDetailModal.propTypes = {
  receiptId: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};
