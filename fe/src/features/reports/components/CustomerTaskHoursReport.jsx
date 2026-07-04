import PropTypes from 'prop-types';
import { useState } from 'react';
import Dropdown from '@/components/chadcn/Dropdown';
import Input from '@/components/chadcn/Input';
import { fmt, fmtDate } from '@/features/reports/constants';
import { useCustomerTaskHours } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
// Default to the current month
const DEFAULT_FILTER = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };
const DEFAULT_RATE = 250; // Sivi-Design standard hourly rate (NIS)

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const num = (v) => (v == null ? 0 : Number(v));
const fmtHours = (v) => (v == null ? '—' : String(v));

export default function CustomerTaskHoursReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');
  const [hourlyRate, setHourlyRate] = useState(String(DEFAULT_RATE));

  const params =
    filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : filter;
  if (customerId) params.customerId = customerId;

  const { data, isLoading, isError, refetch } = useCustomerTaskHours(params);

  const rate = Number(hourlyRate) || 0;
  const rows = data?.rows ?? [];
  const singleCustomer = Boolean(customerId);

  const costOf = (row) => num(row.actualHours) * rate;

  const tableRows = rows.map((row) => ({
    Task: row.name,
    ...(singleCustomer ? {} : { Customer: row.customerName ?? '—' }),
    Status: STATUS_LABELS[row.status] ?? row.status,
    Start: fmtDate(row.startDate) + (row.startTime ? ` ${row.startTime}` : ''),
    End: fmtDate(row.endDate) + (row.endTime ? ` ${row.endTime}` : ''),
    'Est. (h)': fmtHours(row.estimatedHours),
    'Actual (h)': `${fmtHours(row.actualHours)}${row.actualIsEstimate ? ' *' : ''}`,
    Cost: fmt(costOf(row)),
  }));

  const totalActual = rows.reduce((s, r) => s + num(r.actualHours), 0);
  const totalEstimated = data?.totals?.estimatedHours ?? rows.reduce((s, r) => s + num(r.estimatedHours), 0);
  const totalCost = totalActual * rate;

  const tableHeaders = [
    'Task',
    ...(singleCustomer ? [] : ['Customer']),
    'Status',
    'Start',
    'End',
    'Est. (h)',
    'Actual (h)',
    'Cost',
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
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">Hourly fee</span>
        <div className="w-24">
          <Input
            type="number"
            min="0"
            step="10"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const summary = (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Estimated hours', value: `${totalEstimated}h` },
        { label: 'Actual hours', value: `${Number(totalActual.toFixed(2))}h` },
        { label: 'Total cost', value: fmt(totalCost) },
      ].map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );

  return (
    <ReportShell
      title="Task Hours & Cost"
      controls={controls}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      emptyMessage="No tasks in this period."
      chartContent={
        <div className="space-y-6">
          {summary}
          <p className="text-xs text-slate-400">
            Cost = actual hours × hourly fee. Rows marked <span className="font-semibold">*</span>{' '}
            have no logged actual hours yet, so the estimate is used.
          </p>
        </div>
      }
    />
  );
}

CustomerTaskHoursReport.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
};
