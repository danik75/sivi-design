import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import useDeleteReceipt from '../hooks/useDeleteReceipt';

export default function DeleteReceiptDialog({ receipt, onClose, onSuccess }) {
  const [revertInvoice, setRevertInvoice] = useState(false);
  const [error, setError] = useState('');
  const mutation = useDeleteReceipt();

  useEffect(() => {
    setRevertInvoice(false);
    setError('');
  }, [receipt?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  function handleDelete() {
    setError('');
    mutation.mutate(
      { id: receipt.id, revertInvoice },
      {
        onSuccess: () => onSuccess(),
        onError: (err) => {
          const msg = err?.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to delete receipt.');
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Delete Receipt</h2>
          <p className="mt-1 text-sm text-slate-500">
            Delete receipt <span className="font-mono font-semibold text-slate-700">{receipt?.receiptNumber}</span>?
            This cannot be undone.
          </p>

          {/* Invoice revert toggle */}
          <button
            type="button"
            onClick={() => setRevertInvoice((v) => !v)}
            className="mt-4 flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${revertInvoice ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
              {revertInvoice && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Move invoice back to pending</p>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono">{receipt?.invoiceNumber}</span> will be set back to <span className="font-semibold">Sent</span> status.
              </p>
            </div>
          </button>

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            disabled={mutation.isLoading}
            onClick={handleDelete}
          >
            {mutation.isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

DeleteReceiptDialog.propTypes = {
  receipt: PropTypes.shape({
    id: PropTypes.number.isRequired,
    receiptNumber: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
