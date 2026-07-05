import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import SearchInput from '@/components/chadcn/SearchInput';
import { getAvailableExpenses } from '@/features/invoices/services/invoicesApi';

export default function ExpensePickerDialog({
  isOpen,
  onClose,
  customerId,
  excludeInvoiceId,
  existingSourceIds = [],
  onConfirm,
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const { data, isLoading, isError, refetch } = useQuery(
    ['available-expenses', customerId, excludeInvoiceId],
    () => getAvailableExpenses(customerId, excludeInvoiceId),
    { enabled: isOpen && Boolean(customerId) },
  );

  const already = useMemo(() => new Set(existingSourceIds), [existingSourceIds]);
  const expenses = data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (e) =>
        e.vendor?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q),
    );
  }, [expenses, search]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = expenses.filter((e) => selected.has(e.id));
    onConfirm(picked);
    setSelected(new Set());
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSelected(new Set());
    setSearch('');
    onClose();
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
        Add {selected.size || ''} {selected.size === 1 ? 'expense' : 'expenses'}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Add from expenses" footer={footer}>
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search expenses…"
        />
        {isError ? (
          <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Failed to load expenses.
            <button type="button" className="font-medium underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : null}
        <div className="max-h-80 overflow-auto rounded-xl border border-slate-100">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No unlinked expenses for this customer.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {filtered.map((e) => {
                const isAdded = already.has(e.id);
                const checked = isAdded || selected.has(e.id);
                return (
                  <li key={e.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 ${
                        isAdded ? 'opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={checked}
                        disabled={isAdded}
                        onChange={() => toggle(e.id)}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                        {e.vendor}
                        {e.description ? (
                          <span className="ml-2 text-xs text-slate-400">{e.description}</span>
                        ) : null}
                        {isAdded ? <span className="ml-2 text-xs text-slate-400">(added)</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {e.date} · {Number(e.amount).toLocaleString()} {e.currency}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}

ExpensePickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.string,
  excludeInvoiceId: PropTypes.string,
  existingSourceIds: PropTypes.arrayOf(PropTypes.string),
  onConfirm: PropTypes.func.isRequired,
};
