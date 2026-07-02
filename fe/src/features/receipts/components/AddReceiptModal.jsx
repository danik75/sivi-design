import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import useCreateReceipt from '../hooks/useCreateReceipt';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddReceiptModal({ invoice, onClose, onSuccess }) {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paidAt, setPaidAt] = useState(today());
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const mutation = useCreateReceipt();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!receiptNumber.trim()) { setError('Receipt number is required.'); return; }
    if (!paidAt) { setError('Paid date is required.'); return; }
    setError('');

    let fileData, fileName, fileMimeType;
    if (file) {
      fileData = await readFileAsBase64(file);
      fileName = file.name;
      fileMimeType = file.type;
    }

    mutation.mutate(
      { receiptNumber: receiptNumber.trim(), invoiceId: invoice.id, paidAt, fileData, fileName, fileMimeType },
      {
        onSuccess: (saved) => onSuccess(saved),
        onError: (err) => {
          const msg = err?.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save receipt. Please try again.');
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add Receipt</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Invoice {invoice.invoiceNumber} · {invoice.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <FormField label="Receipt number *">
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. REC-2026-001"
              autoFocus
            />
          </FormField>

          <FormField label="Paid date *">
            <DatePicker value={paidAt} onChange={setPaidAt} />
          </FormField>

          <FormField label="Attachment (PDF or image)">
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <span className="text-sm text-slate-600 truncate">
                {file ? file.name : 'Click to upload file…'}
              </span>
              {file && (
                <button
                  type="button"
                  className="ml-auto shrink-0 text-xs text-slate-400 hover:text-rose-500"
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </FormField>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          {/* Invoice summary */}
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice total</span>
              <span className="font-semibold text-slate-800">
                {parseFloat(invoice.total ?? 0).toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Saving…' : 'Save Receipt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddReceiptModal.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string.isRequired,
    customerName: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
