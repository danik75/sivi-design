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

function UsagePie({ customerName, label, used, total, note }) {
  const t = num(total);
  const u = num(used);
  const over = u > t;
  const usedSlice = Math.min(u, t);
  const remaining = Math.max(0, t - u);
  const data = [
    { name: 'Used', value: usedSlice },
    { name: 'Remaining', value: remaining },
  ];
  const colors = [over ? '#e11d48' : '#6366f1', '#e2e8f0'];
  const percent = t > 0 ? Math.min(1, u / t) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="truncate text-sm font-semibold text-slate-800">{customerName}</p>
      <p className="text-xs text-slate-400">{label}</p>
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
      <p className="text-center text-sm font-bold text-slate-900">{Math.round(percent * 100)}% used</p>
      <p className="text-center text-xs text-slate-500">
        {Number(u)}h of {Number(t)}h
        {over ? (
          <span className="font-semibold text-rose-600"> · over by {Number((u - t).toFixed(2))}h</span>
        ) : (
          <span> · {Number((t - u).toFixed(2))}h left</span>
        )}
      </p>
      {note ? <p className="text-center text-[11px] text-slate-400">{note}</p> : null}
    </div>
  );
}

UsagePie.propTypes = {
  customerName: PropTypes.string,
  label: PropTypes.string,
  used: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  note: PropTypes.string,
};

export default function TasksPerContractReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');

  const params = {
    ...(filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : { period: 'monthly', year: filter.year, month: filter.month }),
    ...(customerId ? { customerId } : {}),
  };

  const { data, isLoading, isError, refetch } = useTasksPerContract(params);
  const rows = data?.rows ?? [];
  const prepaidRows = rows.filter(
    (r) => r.contractType === 'prepaid_hours' && r.hoursPurchased != null
  );
  const retainerRows = rows.filter(
    (r) => r.contractType === 'monthly_retainer' && r.hoursPerMonth != null
  );

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
      <div className="w-40">
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
        prepaidRows.length || retainerRows.length ? (
          <div className="space-y-6">
            {prepaidRows.length ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Prepaid-hours usage
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {prepaidRows.map((r) => (
                    <UsagePie
                      key={r.contractId}
                      customerName={r.customerName}
                      label={r.contractLabel}
                      used={r.hoursUsed}
                      total={r.hoursPurchased}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {retainerRows.length ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Monthly-retainer usage
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {retainerRows.map((r) => (
                    <UsagePie
                      key={r.contractId}
                      customerName={r.customerName}
                      label={r.contractLabel}
                      used={r.actualHours}
                      total={r.hoursPerMonth}
                      note="Actual hours logged in this period"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No prepaid or retainer contracts in this period.
          </p>
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
