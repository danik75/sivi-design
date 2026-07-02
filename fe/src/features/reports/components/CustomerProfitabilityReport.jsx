import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, fmt, MARGIN_COLOR } from '@/features/reports/constants';
import { useCustomerProfitability } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

export default function CustomerProfitabilityReport() {
  const [filter, setFilter] = useState(DEFAULT);
  const params = filter.period === 'range' ? { period: 'range', from: filter.from, to: filter.to }
    : filter.period === 'yearly' ? { period: 'yearly', year: filter.year } : filter;
  const { data, isLoading, isError, refetch } = useCustomerProfitability(params);

  const rows = data?.rows ?? [];
  const chartData = rows.map((r, i) => ({
    name: r.customerName,
    Revenue: parseFloat(r.revenue),
    Profit: parseFloat(r.profit),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const marginData = rows.map((r, i) => ({
    name: r.customerName,
    margin: parseFloat(r.marginPct),
    color: parseFloat(r.marginPct) >= 70 ? '#10b981' : parseFloat(r.marginPct) >= 40 ? '#f59e0b' : '#ef4444',
  }));

  const tableRows = rows.map((r) => ({
    Customer: r.customerName,
    Revenue: r.revenue,
    Expenses: r.expenses,
    Profit: r.profit,
    'Margin %': `${r.marginPct}%`,
    Invoices: r.invoiceCount,
    Currency: r.currency,
  }));

  return (
    <ReportShell
      title="Customer Profitability"
      controls={<PeriodFilter value={filter} onChange={setFilter} />}
      isLoading={isLoading} isError={isError} onRetry={refetch}
      tableHeaders={['Customer','Revenue','Expenses','Profit','Margin %','Invoices','Currency']}
      tableRows={tableRows}
      chartContent={
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Revenue vs Profit</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52}
                  tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={28} />
                <Bar dataKey="Profit" fill="#10b981" radius={[3,3,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Margin %</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={marginData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Margin']} />
                <Bar dataKey="margin" radius={[3,3,0,0]} maxBarSize={28}>
                  {marginData.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
    />
  );
}
