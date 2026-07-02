import { useState } from 'react';
import TrashIcon from '@/components/chadcn/icons/TrashIcon';
import useToast from '@/components/chadcn/useToast';
import useReceipts from './hooks/useReceipts';
import DeleteReceiptDialog from './components/DeleteReceiptDialog';
import ReceiptDetailModal from './components/ReceiptDetailModal';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(amount, currency) {
  if (amount == null) return '—';
  return `${parseFloat(amount).toFixed(2)} ${currency ?? ''}`.trim();
}

const FileChip = ({ fileName, fileMimeType }) => {
  if (!fileName) return <span className="text-slate-300">—</span>;
  const isImage = fileMimeType?.startsWith('image/');
  const isPdf = fileMimeType === 'application/pdf';
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {isPdf ? '📄' : isImage ? '🖼️' : '📎'} {fileName}
    </span>
  );
};

export default function ReceiptsFeature() {
  const { data: receipts = [], isLoading, isError } = useReceipts();
  const { showToast } = useToast();
  const [detailId, setDetailId] = useState(null);
  const [deleteReceipt, setDeleteReceipt] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Receipts</h1>
        <p className="mt-2 text-sm text-slate-500">All paid invoice receipts, with optional file attachments.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {isLoading && (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
          </div>
        )}

        {isError && <p className="p-6 text-sm text-rose-600">Unable to load receipts.</p>}

        {!isLoading && !isError && receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-4 text-sm font-medium text-slate-500">No receipts yet</p>
            <p className="mt-1 text-xs text-slate-400">Mark an invoice as paid to add a receipt.</p>
          </div>
        )}

        {!isLoading && !isError && receipts.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid on</th>
                <th className="px-4 py-3">Attachment</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {receipts.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`cursor-pointer border-b border-slate-50 bg-white hover:bg-slate-50/60 transition-colors ${idx === receipts.length - 1 ? 'border-none' : ''}`}
                  onClick={() => setDetailId(r.id)}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.receiptNumber}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{r.customerName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{fmtMoney(r.total, r.currency)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(r.paidAt)}</td>
                  <td className="px-4 py-3">
                    <FileChip fileName={r.fileName} fileMimeType={r.fileMimeType} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteReceipt(r); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      aria-label="Delete receipt"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailId != null && (
        <ReceiptDetailModal receiptId={detailId} onClose={() => setDetailId(null)} />
      )}

      {deleteReceipt && (
        <DeleteReceiptDialog
          receipt={deleteReceipt}
          onClose={() => setDeleteReceipt(null)}
          onSuccess={() => {
            setDeleteReceipt(null);
            showToast('Receipt deleted.', 'success');
          }}
        />
      )}
    </div>
  );
}
