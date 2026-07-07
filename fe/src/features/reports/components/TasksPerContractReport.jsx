import PropTypes from 'prop-types';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Dropdown from '@/components/chadcn/Dropdown';
import { useTasksPerContract } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT_FILTER = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

const num = (v) => (v == null ? 0 : Number(v));
const h = (v) => (v == null ? '—' : `${Number(v)}h`);
const pct = (v) => (v == null ? '—' : `${Math.round(Number(v) * 100)}%`);

function PrepaidPie({ row }) {
  const purchased = num(row.hoursPurchased);
  const used = num(row.hoursUsed);
  const over = used > purchased;
  const usedSlice = Math.min(used, purchased);
  const remaining = Math.max(0, purchased - used);
  const data = [
    { name: 'Used', value: usedSlice },
    { name: 'Remaining', value: remaining },
  ];
  const colors = [over ? '#e11d48' : '#6366f1', '#e2e8f0'];
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="truncate text-sm font-semibold text-slate-800">{row.customerName}</p>
      <p className="text-xs text-slate-400">{row.contractLabel}</p>
      <div className="mx-auto h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [`${Number(v)}h`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm font-bold text-slate-900">{pct(row.percentUsed)} used</p>
      <p className="text-center text-xs text-slate-500">
        {h(row.hoursUsed)} of {h(row.hoursPurchased)}
        {over ? (
          <span className="font-semibold text-rose-600"> · over by {Number(used - purchased)}h</span>
        ) : (
          <span> · {h(row.hoursRemaining)} left</span>
        )}
      </p>
    </div>
  );
}

PrepaidPie.propTypes = { row: PropTypes.object.isRequired };

export default function TasksPerContractReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');

  const params =
    filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : filter;
  if (customerId) params.customerId = customerId;

  const { data, isLoading, isError, refetch } = useTasksPerContract(params);
  const rows = data?.rows ?? [];
  const prepaidRows = rows.filter((r) => r.contractType === 'prepaid_hours');

  const tableHeaders = [
    'Customer',
    'Contract',
    'Tasks',
    'Est. (h)',
    'Actual (h)',
    'Purchased',
    'Used',
    'Remaining',
    '% Used',
  ];
  const tableRows = rows.map((r) => ({
    Customer: r.customerName ?? '—',
    Contract: r.contractLabel,
    Tasks: r.taskCount,
    'Est. (h)': h(r.estimatedHours),
    'Actual (h)': h(r.actualHours),
    Purchased: h(r.hoursPurchased),
    Used: h(r.hoursUsed),
    Remaining: h(r.hoursRemaining),
    '% Used': pct(r.percentUsed),
  }));

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
      title="Tasks per Contract"
      controls={controls}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      emptyMessage="No contracts with tasks in this period."
      chartContent={
        prepaidRows.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Prepaid-hours usage
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {prepaidRows.map((r) => (
                <PrepaidPie key={r.contractId} row={r} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No prepaid-hours contracts in this period.</p>
        )
      }
    />
  );
}

TasksPerContractReport.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
};
