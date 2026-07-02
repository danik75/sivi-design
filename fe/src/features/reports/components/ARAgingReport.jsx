import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AGING_BUCKETS,
  BUCKET_COLOR,
  BUCKET_LABEL,
  fmt,
  fmtDate,
} from '@/features/reports/constants';
import { useARaging } from '@/features/reports/hooks';
import ReportShell from './shared/ReportShell';

export default function ARAgingReport() {
  const { data, isLoading, isError, refetch } = useARaging();

  const chartData = AGING_BUCKETS.map((b) => ({
    name: b.label,
    amount: parseFloat(data?.summary?.[b.key] ?? 0),
    color: b.color,
  }));

  const tableRows = (data?.invoices ?? []).map((inv) => ({
    Customer: inv.customerName,
    'Invoice #': inv.invoiceNumber,
    'Issue Date': fmtDate(inv.issueDate),
    'Due Date': fmtDate(inv.dueDate),
    'Days Overdue': inv.daysOverdue,
    Amount: inv.total,
    Currency: inv.currency,
    Bucket: BUCKET_LABEL[inv.bucket],
  }));

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-5 gap-3">
          {AGING_BUCKETS.map((b) => (
            <div key={b.key} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {b.label}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: b.color }}>
                {fmt(parseFloat(summary[b.key] ?? 0))}
              </p>
            </div>
          ))}
        </div>
      )}
      <ReportShell
        title="AR Aging"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tableHeaders={[
          'Customer',
          'Invoice #',
          'Issue Date',
          'Due Date',
          'Days Overdue',
          'Amount',
          'Currency',
          'Bucket',
        ]}
        tableRows={tableRows}
        chartContent={
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
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
              <Tooltip formatter={(v) => [fmt(v), 'Outstanding']} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        }
      />
    </div>
  );
}
