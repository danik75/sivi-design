import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, fmt } from '@/features/reports/constants';
import { useRevenueBreakdown } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

export default function RevenueBreakdownReport() {
  const [filter, setFilter] = useState(DEFAULT);
  const [subTab, setSubTab] = useState('customers');
  const params = filter.period === 'range' ? { period: 'range', from: filter.from, to: filter.to } : filter.period === 'yearly' ? { period: 'yearly', year: filter.year } : filter;
  const { data, isLoading, isError, refetch } = useRevenueBreakdown(params);

  const custData = (data?.byCustomer ?? []).map((r) => ({ name: r.customerName, Revenue: parseFloat(r.revenue), Expenses: parseFloat(r.expenses) }));
  const catData  = (data?.expensesByCategory ?? []).map((r, i) => ({ name: r.category, value: parseFloat(r.total), color: CHART_COLORS[i % CHART_COLORS.length] }));

  const tableRows = subTab === 'customers'
    ? (data?.byCustomer ?? []).map((r) => ({ Customer: r.customerName, Revenue: r.revenue, Expenses: r.expenses, Net: r.net, Currency: r.currency }))
    : (data?.expensesByCategory ?? []).map((r) => ({ Category: r.category, Total: r.total, '%': r.pct, Count: r.count, Currency: r.currency }));
  const tableHeaders = subTab === 'customers' ? ['Customer','Revenue','Expenses','Net','Currency'] : ['Category','Total','%','Count','Currency'];

  return (
    <ReportShell
      title="Revenue Breakdown"
      controls={<PeriodFilter value={filter} onChange={setFilter} />}
      isLoading={isLoading} isError={isError} onRetry={refetch}
      tableHeaders={tableHeaders} tableRows={tableRows}
      chartContent={
        <div className="space-y-6">
          <div className="flex gap-2 mb-2">
            {['customers','categories'].map((t) => (
              <button key={t} type="button" onClick={() => setSubTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${subTab === t ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {t === 'customers' ? 'By Customer' : 'Expense Categories'}
              </button>
            ))}
          </div>
          {subTab === 'customers' && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={custData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52}
                  tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={32} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[3,3,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {subTab === 'categories' && (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                    {catData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {catData.map((e, i) => (
                  <li key={e.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-700 capitalize">{e.name}</span>
                    <span className="text-slate-400">{fmt(e.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
    />
  );
}
