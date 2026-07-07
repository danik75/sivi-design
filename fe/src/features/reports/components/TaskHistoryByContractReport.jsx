import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Dropdown from '@/components/chadcn/Dropdown';
import { fmtDate } from '@/features/reports/constants';
import { useTaskHistory } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const num = (v) => (v == null ? 0 : Number(v));

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

const NO_CONTRACT = '__none__';

export default function TaskHistoryByContractReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');
  const [contractId, setContractId] = useState('');

  const params = {
    ...(filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : { period: 'monthly', year: filter.year, month: filter.month }),
    ...(customerId ? { customerId } : {}),
  };

  const { data, isLoading, isError, refetch } = useTaskHistory(params);
  const groups = data?.customers ?? [];
  const singleCustomer = Boolean(customerId);

  // Contract options built from the fetched data (+ "All" and "No contract").
  const contractOptions = [
    { value: '', label: 'All contracts' },
    { value: NO_CONTRACT, label: 'No contract' },
    ...groups.flatMap((cust) =>
      (cust.contracts ?? []).map((c) => ({
        value: c.contractId,
        label: singleCustomer ? c.contractLabel : `${cust.customerName} — ${c.contractLabel}`,
      }))
    ),
  ];

  // Flatten to rows: Customer → each contract's tasks, then the No-contract bucket,
  // respecting the contract filter.
  const tableRows = [];
  const showContract = contractId !== NO_CONTRACT; // hide contract tasks when "No contract" selected
  const showUnassigned = contractId === '' || contractId === NO_CONTRACT;
  for (const cust of groups) {
    if (showContract) {
      for (const contract of cust.contracts ?? []) {
        if (contractId && contractId !== NO_CONTRACT && contract.contractId !== contractId) continue;
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
    }
    if (showUnassigned) {
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

  // Per-customer totals for the chart.
  const chartData = groups
    .map((cust) => {
      let estimated = 0;
      let actual = 0;
      let tasks = 0;
      for (const contract of cust.contracts ?? []) {
        for (const t of contract.tasks ?? []) {
          estimated += num(t.estimatedHours);
          actual += num(t.actualHours);
          tasks += 1;
        }
      }
      for (const t of cust.unassignedTasks ?? []) {
        estimated += num(t.estimatedHours);
        actual += num(t.actualHours);
        tasks += 1;
      }
      return {
        name: cust.customerName,
        estimated: Number(estimated.toFixed(2)),
        actual: Number(actual.toFixed(2)),
        tasks,
      };
    })
    .filter((d) => d.tasks > 0)
    .sort((a, b) => b.actual + b.estimated - (a.actual + a.estimated));

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <PeriodFilter value={filter} onChange={setFilter} />
      <div className="w-40">
        <Dropdown
          value={customerId}
          onChange={(v) => {
            setCustomerId(v);
            setContractId('');
          }}
          placeholder="All customers"
          options={[
            { value: '', label: 'All customers' },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>
      <div className="w-40">
        <Dropdown
          value={contractId}
          onChange={setContractId}
          placeholder="All contracts"
          options={contractOptions}
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
        chartData.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Estimated vs actual hours by customer
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => [`${Number(v)}h`, n === 'actual' ? 'Actual' : 'Estimated']} />
                  <Legend />
                  <Bar dataKey="estimated" name="Estimated" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400">
              Tasks grouped by customer and contract in the table. Tasks not tied to a contract
              appear under &ldquo;No contract&rdquo;.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No tasks in this period.</p>
        )
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
