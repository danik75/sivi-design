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
import { fmt, fmtDate } from '@/features/reports/constants';
import { useForecast } from '@/features/reports/hooks';
import ReportShell from './shared/ReportShell';

export default function ForecastReport() {
  const { data, isLoading, isError, refetch } = useForecast();

  const chartData = (data?.summary ?? []).map((m) => ({
    month: m.month,
    Confirmed: parseFloat(m.confirmed),
    Projected: parseFloat(m.projected),
  }));

  const allItems = [...(data?.confirmed ?? []), ...(data?.projected ?? [])].sort((a, b) =>
    a.forecastMonth.localeCompare(b.forecastMonth)
  );

  const tableRows = allItems.map((r) => ({
    Month: r.forecastMonth,
    Customer: r.customerName,
    Source: r.source.replace(/_/g, ' '),
    Reference: r.invoiceNumber || '—',
    'Due Date': r.dueDate ? fmtDate(r.dueDate) : '—',
    Amount: r.amount,
    Currency: r.currency,
  }));

  const totalForecast = (data?.summary ?? []).reduce((s, m) => s + parseFloat(m.total), 0);

  return (
    <div className="space-y-4">
      {data && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Forecast', value: totalForecast, cls: 'text-slate-900' },
            {
              label: 'Confirmed',
              value: (data?.confirmed ?? []).reduce((s, r) => s + parseFloat(r.amount), 0),
              cls: 'text-emerald-600',
            },
            {
              label: 'Projected',
              value: (data?.projected ?? []).reduce((s, r) => s + parseFloat(r.amount), 0),
              cls: 'text-indigo-600',
            },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>
      )}
      <ReportShell
        title="Revenue Forecast"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tableHeaders={[
          'Month',
          'Customer',
          'Source',
          'Reference',
          'Due Date',
          'Amount',
          'Currency',
        ]}
        tableRows={tableRows}
        chartContent={
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
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
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="Confirmed"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Projected"
                stackId="a"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        }
      />
    </div>
  );
}
