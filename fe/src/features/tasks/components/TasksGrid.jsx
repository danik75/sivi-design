import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import SearchInput from '@/components/chadcn/SearchInput';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import { STATUS_CONFIG, TASK_TEXT, getApiErrorMessage } from '@/features/tasks/constants';
import useTasks from '@/features/tasks/hooks/useTasks';

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

StatusBadge.propTypes = {
  status: PropTypes.string,
};

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

ProgressBar.propTypes = {
  value: PropTypes.number,
};

function TaskRow({ task, onEdit, onDelete }) {
  return (
    <TableRow>
      <TableCell>
        <span className="font-medium text-slate-900">{task.name}</span>
        {task.description ? (
          <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{task.description}</p>
        ) : null}
      </TableCell>
      <TableCell>{task.customerName ?? TASK_TEXT.placeholder}</TableCell>
      <TableCell>{task.startDate ?? TASK_TEXT.placeholder}</TableCell>
      <TableCell>{task.endDate ?? TASK_TEXT.placeholder}</TableCell>
      <TableCell>
        <StatusBadge status={task.status} />
      </TableCell>
      <TableCell>{task.estimatedHours != null ? task.estimatedHours : TASK_TEXT.placeholder}</TableCell>
      <TableCell>
        <ProgressBar value={task.percentComplete} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => onEdit(task)}
            aria-label={TASK_TEXT.rowActions.edit}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            className="px-2 py-1 text-xs"
            onClick={() => onDelete(task)}
            aria-label={TASK_TEXT.rowActions.delete}
          >
            Delete
          </Button>
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
  onDelete: PropTypes.func.isRequired,
};

export default function TasksGrid({ onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, error, isError, isLoading, isFetching, refetch } = useTasks({
    search: debouncedSearch,
    page,
  });

  const tasks = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasSearch = Boolean(debouncedSearch);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const emptyStateAction = useMemo(() => {
    if (hasSearch) {
      return (
        <Button type="button" variant="ghost" onClick={() => setSearch('')}>
          {TASK_TEXT.clearSearch}
        </Button>
      );
    }

    return <Button onClick={onCreate}>{TASK_TEXT.addTask}</Button>;
  }, [hasSearch, onCreate]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

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
      ) : tasks.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
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
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {TASK_TEXT.pagination.label(page, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                {TASK_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
              >
                {TASK_TEXT.pagination.next}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={hasSearch ? '🔎' : '📋'}
          title={hasSearch ? TASK_TEXT.noResultsTitle : TASK_TEXT.noDataTitle}
          description={
            hasSearch ? TASK_TEXT.noResultsDescription : TASK_TEXT.noDataDescription
          }
          action={emptyStateAction}
        />
      )}

      {!isLoading && isFetching ? (
        <div className="text-right text-xs text-slate-400">{TASK_TEXT.loading}</div>
      ) : null}
    </section>
  );
}

TasksGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
