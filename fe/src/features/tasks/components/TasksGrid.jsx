import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import SearchInput from '@/components/chadcn/SearchInput';
import {
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import { STATUS_CONFIG, TASK_TEXT, getApiErrorMessage } from '@/features/tasks/constants';
import useTasks from '@/features/tasks/hooks/useTasks';
import useUpdateTask from '@/features/tasks/hooks/useUpdateTask';

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}

StatusBadge.propTypes = { status: PropTypes.string };

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{pct}%</span>
    </div>
  );
}

ProgressBar.propTypes = { value: PropTypes.number };

function fmtDate(str) {
  if (!str) return '—';
  if (str.includes('T')) {
    const dt = new Date(str);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(-2)}`;
  }
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${String(y).slice(-2)}`;
}

function TaskRow({ task, onEdit, onAbort, onDoubleClick }) {
  const isAborted = task.status === 'cancelled';
  return (
    <TableRow onDoubleClick={onDoubleClick}>
      <TableCell>
        <span className="font-medium text-slate-900">{task.name}</span>
        {task.description ? (
          <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{task.description}</p>
        ) : null}
      </TableCell>
      <TableCell>{task.customerName ?? TASK_TEXT.placeholder}</TableCell>
      <TableCell>{task.startDate ? fmtDate(task.startDate) : TASK_TEXT.placeholder}</TableCell>
      <TableCell>{task.endDate ? fmtDate(task.endDate) : TASK_TEXT.placeholder}</TableCell>
      <TableCell>
        <StatusBadge status={task.status} />
      </TableCell>
      <TableCell>
        {task.estimatedHours != null ? task.estimatedHours : TASK_TEXT.placeholder}
      </TableCell>
      <TableCell>
        <ProgressBar value={task.percentComplete} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => onEdit(task)}
          >
            Edit
          </Button>
          {!isAborted && (
            <Button
              type="button"
              variant="danger"
              className="px-2 py-1 text-xs"
              onClick={() => onAbort(task)}
            >
              Abort
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

TaskRow.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string,
    customerName: PropTypes.string,
    estimatedHours: PropTypes.number,
    percentComplete: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onAbort: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
};

const ROW_HEIGHT = 52; // px — approximate single-line row height
const MAX_VISIBLE_ROWS = 10;
const SCROLL_MAX_HEIGHT = ROW_HEIGHT * MAX_VISIBLE_ROWS;

export default function TasksGrid({ onCreate, onEdit, visibleStatuses }) {
  const [search, setSearch] = useState('');
  const abortMutation = useUpdateTask();

  const { data, error, isError, isLoading, refetch } = useTasks({ limit: 10000 });

  const allTasks = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (visibleStatuses && !visibleStatuses.has(t.status)) return false;
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q)
      );
    });
  }, [allTasks, search, visibleStatuses]);

  const hasSearch = Boolean(search.trim());

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setPage(1);
  };

  const emptyStateAction = useMemo(() => {
    if (hasSearch) {
      return (
        <Button type="button" variant="ghost" onClick={handleSearchClear}>
          {TASK_TEXT.clearSearch}
        </Button>
      );
    }
    return <Button onClick={onCreate}>{TASK_TEXT.addTask}</Button>;
  }, [hasSearch, onCreate]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{TASK_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{TASK_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{TASK_TEXT.addTask}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={TASK_TEXT.searchPlaceholder}
        />
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, TASK_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {TASK_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {TASK_TEXT.loading}
        </div>
      ) : filtered.length ? (
        <div
          className="w-full overflow-auto rounded-xl border border-slate-100 shadow-sm"
          style={{ maxHeight: SCROLL_MAX_HEIGHT }}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <TableRow>
                <TableHeader>{TASK_TEXT.headers.name}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.customer}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.start}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.end}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.status}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.estimatedHours}</TableHeader>
                <TableHeader>{TASK_TEXT.headers.percentComplete}</TableHeader>
                <TableHeader />
              </TableRow>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onAbort={(t) => abortMutation.mutate({ id: t.id, data: { status: 'cancelled' } })}
                  onDoubleClick={() => onEdit(task)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={hasSearch ? '🔎' : '📋'}
          title={hasSearch ? TASK_TEXT.noResultsTitle : TASK_TEXT.noDataTitle}
          description={hasSearch ? TASK_TEXT.noResultsDescription : TASK_TEXT.noDataDescription}
          action={emptyStateAction}
        />
      )}
    </section>
  );
}

TasksGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  visibleStatuses: PropTypes.instanceOf(Set),
};
