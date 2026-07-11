import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import SearchInput from '@/components/chadcn/SearchInput';
import { getAvailableTasks } from '@/features/invoices/services/invoicesApi';

const fmtHours = (v) => (v == null ? null : String(Number(v)));

export default function TaskPickerDialog({
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
    ['available-tasks', customerId, excludeInvoiceId],
    () => getAvailableTasks(customerId, excludeInvoiceId),
    { enabled: isOpen && Boolean(customerId) },
  );

  const already = useMemo(() => new Set(existingSourceIds), [existingSourceIds]);
  const tasks = data ?? [];

  // Pre-select the tasks that aren't already on the invoice (e.g. removed ones),
  // so re-adding them is a single confirm.
  useEffect(() => {
    if (!isOpen || !data) return;
    const addedSet = new Set(existingSourceIds);
    setSelected(new Set(data.filter((t) => !addedSet.has(t.id)).map((t) => t.id)));
  }, [isOpen, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.name?.toLowerCase().includes(q));
  }, [tasks, search]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = tasks.filter((t) => selected.has(t.id));
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
        Add {selected.size || ''} {selected.size === 1 ? 'task' : 'tasks'}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Add from tasks" footer={footer}>
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search done tasks…"
        />
        {isError ? (
          <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Failed to load tasks.
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
              No done, unlinked tasks for this customer.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {filtered.map((t) => {
                const isAdded = already.has(t.id);
                const checked = isAdded || selected.has(t.id);
                const hours = fmtHours(t.actualHours) ?? fmtHours(t.estimatedHours);
                return (
                  <li key={t.id}>
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
                        onChange={() => toggle(t.id)}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                        {t.name}
                        {isAdded ? <span className="ml-2 text-xs text-slate-400">(added)</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {t.endDate}
                        {hours != null ? ` · ${hours}h` : ''}
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

TaskPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.string,
  excludeInvoiceId: PropTypes.string,
  existingSourceIds: PropTypes.arrayOf(PropTypes.string),
  onConfirm: PropTypes.func.isRequired,
};
