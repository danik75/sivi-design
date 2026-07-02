import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, fmt } from '@/features/reports/constants';
import { useExpenseAnalysis } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

export default function ExpenseAnalysisReport() {
  const [filter, setFilter] = useState(DEFAULT);
  const [subTab, setSubTab] = useState('category');
  const params =
    filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : filter;
  const { data, isLoading, isError, refetch } = useExpenseAnalysis(params);

  const catData = (data?.byCategory ?? []).map((r, i) => ({
    name: r.category,
    value: parseFloat(r.total),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const vendorData = (data?.byVendor ?? []).map((r) => ({
    name: r.vendor ?? '(none)',
    total: parseFloat(r.total),
  }));
  const custData = (data?.byCustomer ?? []).map((r) => ({
    name: r.customerName,
    total: parseFloat(r.total),
  }));

  const tableRows =
    subTab === 'category'
      ? (data?.byCategory ?? []).map((r) => ({
          Category: r.category,
          Total: r.total,
          '%': r.pct,
          Count: r.count,
          Currency: r.currency,
        }))
      : subTab === 'vendor'
        ? (data?.byVendor ?? []).map((r) => ({
            Vendor: r.vendor ?? '—',
            Category: r.category,
            Total: r.total,
            Count: r.count,
            Currency: r.currency,
          }))
        : (data?.byCustomer ?? []).map((r) => ({
            Customer: r.customerName,
            Total: r.total,
            Count: r.count,
            Currency: r.currency,
          }));

  const tableHeaders =
    subTab === 'category'
      ? ['Category', 'Total', '%', 'Count', 'Currency']
      : subTab === 'vendor'
        ? ['Vendor', 'Category', 'Total', 'Count', 'Currency']
        : ['Customer', 'Total', 'Count', 'Currency'];

  return (
    <div className="space-y-4">
      {data && (
        <div className="rounded-xl border border-slate-100 bg-rose-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            Total Expenses
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">
            {fmt(parseFloat(data.totalExpenses))}
          </p>
        </div>
      )}
      <ReportShell
        title="Expense Analysis"
        controls={<PeriodFilter value={filter} onChange={setFilter} />}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tableHeaders={tableHeaders}
        tableRows={tableRows}
        chartContent={
          <div className="space-y-4">
            <div className="flex gap-2">
              {['category', 'vendor', 'customer'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubTab(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${subTab === t ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {t === 'category' ? 'By Category' : t === 'vendor' ? 'By Vendor' : 'By Customer'}
                </button>
              ))}
            </div>
            {subTab === 'category' && (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={catData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {catData.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {catData.map((e, i) => (
                    <li key={e.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-slate-700 capitalize">{e.name}</span>
                      <span className="text-slate-400">{fmt(e.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {subTab === 'vendor' && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={vendorData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip formatter={(v) => [fmt(v), 'Total']} />
                  <Bar dataKey="total" fill="#f43f5e" radius={[0, 3, 3, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {subTab === 'customer' && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={custData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip formatter={(v) => [fmt(v), 'Expenses']} />
                  <Bar dataKey="total" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        }
      />
    </div>
  );
}
