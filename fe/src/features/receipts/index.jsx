import { useState } from 'react';
import Button from '@/components/chadcn/Button';
import DatePicker from '@/components/chadcn/DatePicker';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import TrashIcon from '@/components/chadcn/icons/TrashIcon';
import useToast from '@/components/chadcn/useToast';
import useCustomers from '@/features/customers/hooks/useCustomers';
import Dropdown from '@/components/chadcn/Dropdown';
import useReceipts from './hooks/useReceipts';
import DeleteReceiptDialog from './components/DeleteReceiptDialog';
import ReceiptDetailModal from './components/ReceiptDetailModal';

const PAGE_SIZE = 15;

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
  const { showToast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [detailId, setDetailId] = useState(null);
  const [deleteReceipt, setDeleteReceipt] = useState(null);

  const params = {
    ...(search.trim() && { search: search.trim() }),
    ...(customerId && { customerId }),
    ...(from && { from }),
    ...(to && { to }),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useReceipts(params);
  const receipts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: customersPage } = useCustomers({ limit: 10000 });
  const customers = customersPage?.data ?? [];
  const customerOptions = [
    { value: '', label: 'All customers' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  function resetFilters() {
    setSearch('');
    setCustomerId('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  const hasFilters = search || customerId || from || to;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Receipts</h1>
        <p className="mt-2 text-sm text-slate-500">All paid invoice receipts, with optional file attachments.</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Search">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Receipt # or Invoice #"
            />
          </FormField>
          <FormField label="Customer">
            <Dropdown
              value={customerId}
              onChange={(v) => { setCustomerId(v); setPage(1); }}
              options={customerOptions}
              placeholder="All customers"
            />
          </FormField>
          <FormField label="From">
            <DatePicker value={from} onChange={(v) => { setFrom(v); setPage(1); }} placeholder="Start date" />
          </FormField>
          <FormField label="To">
            <DatePicker value={to} onChange={(v) => { setTo(v); setPage(1); }} placeholder="End date" />
          </FormField>
        </div>
        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="ghost" onClick={resetFilters} className="text-xs px-3 py-1.5">
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {isLoading && (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
          </div>
        )}

        {isError && <p className="p-6 text-sm text-rose-600">Unable to load receipts.</p>}

        {!isLoading && !isError && receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {hasFilters ? 'No receipts match the filters.' : 'No receipts yet'}
            </p>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="mt-2 text-xs text-indigo-600 hover:underline">
                Clear filters
              </button>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Mark an invoice as paid to add a receipt.</p>
            )}
          </div>
        )}

        {!isLoading && !isError && receipts.length > 0 && (
          <>
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

            {/* Pagination */}
            <div className="flex flex-col gap-3 rounded-b-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
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
