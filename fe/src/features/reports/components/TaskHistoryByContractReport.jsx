import PropTypes from 'prop-types';
import { useState } from 'react';
import Dropdown from '@/components/chadcn/Dropdown';
import { fmtDate } from '@/features/reports/constants';
import { useTaskHistory } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
// History defaults to the current year.
const DEFAULT_FILTER = { period: 'yearly', year: now.getFullYear(), month: now.getMonth() + 1 };

const h = (v) => (v == null ? '—' : `${Number(v)}h`);
const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export default function TaskHistoryByContractReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');

  const params =
    filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : filter;
  if (customerId) params.customerId = customerId;

  const { data, isLoading, isError, refetch } = useTaskHistory(params);
  const groups = data?.customers ?? [];

  // Flatten to rows: Customer → each contract's tasks, then the No-contract bucket.
  const tableRows = [];
  for (const cust of groups) {
    for (const contract of cust.contracts ?? []) {
      for (const t of contract.tasks ?? []) {
        tableRows.push({
          Customer: cust.customerName,
          Contract: contract.contractLabel,
          Task: t.name,
          Start: fmtDate(t.startDate),
          End: fmtDate(t.endDate),
          Status: STATUS_LABELS[t.status] ?? t.status,
          'Est. (h)': h(t.estimatedHours),
          'Actual (h)': h(t.actualHours),
        });
      }
    }
    for (const t of cust.unassignedTasks ?? []) {
      tableRows.push({
        Customer: cust.customerName,
        Contract: '— No contract —',
        Task: t.name,
        Start: fmtDate(t.startDate),
        End: fmtDate(t.endDate),
        Status: STATUS_LABELS[t.status] ?? t.status,
        'Est. (h)': h(t.estimatedHours),
        'Actual (h)': h(t.actualHours),
      });
    }
  }

  const tableHeaders = [
    'Customer',
    'Contract',
    'Task',
    'Start',
    'End',
    'Status',
    'Est. (h)',
    'Actual (h)',
  ];

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <PeriodFilter value={filter} onChange={setFilter} />
      <div className="w-52">
        <Dropdown
          value={customerId}
          onChange={setCustomerId}
          placeholder="All customers"
          options={[
            { value: '', label: 'All customers' },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>
    </div>
  );

  return (
    <ReportShell
      title="Task History by Customer / Contract"
      controls={controls}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      emptyMessage="No tasks in this period."
      chartContent={
        <p className="text-xs text-slate-400">
          Tasks grouped by customer and contract. Tasks not tied to a contract appear under
          &ldquo;No contract&rdquo;.
        </p>
      }
    />
  );
}

TaskHistoryByContractReport.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
};
