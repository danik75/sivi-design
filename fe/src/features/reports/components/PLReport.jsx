import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt } from '@/features/reports/constants';
import { usePL } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

export default function PLReport() {
  const [filter, setFilter] = useState(DEFAULT);
  const params = filter.period === 'range' ? { period: 'range', from: filter.from, to: filter.to } : filter.period === 'yearly' ? { period: 'yearly', year: filter.year } : { period: 'monthly', year: filter.year, month: filter.month };
  const { data, isLoading, isError, refetch } = usePL(params);

  const chartData = data?.trend ?? [];
  const tableRows = (data?.trend ?? []).map((r) => ({
    Period: r.label, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit,
  }));

  const summary = data?.summary?.[0];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Revenue',  value: summary.revenue,  cls: 'text-slate-900' },
            { label: 'Expenses', value: summary.expenses, cls: 'text-slate-900' },
            { label: 'Profit',   value: summary.profit,   cls: parseFloat(summary.profit) >= 0 ? 'text-emerald-600' : 'text-rose-600' },
            { label: 'Margin',   value: `${summary.marginPct}%`, cls: 'text-indigo-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>
                {label === 'Margin' ? value : fmt(parseFloat(value), summary.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
      <ReportShell
        title="P&L Statement"
        controls={<PeriodFilter value={filter} onChange={setFilter} />}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        tableHeaders={['Period','Revenue','Expenses','Profit']}
        tableRows={tableRows}
        chartContent={
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52}
                tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={24} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3,3,0,0]} maxBarSize={24} />
              <Line dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        }
      />
    </div>
  );
}
