import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt, fmtDate } from '@/features/reports/constants';
import { useTaxSummary } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT = { period: 'monthly', year: now.getFullYear(), month: now.getMonth() + 1 };

export default function TaxSummaryReport() {
  const [filter, setFilter] = useState(DEFAULT);
  const params = filter.period === 'range' ? { period: 'range', from: filter.from, to: filter.to }
    : filter.period === 'yearly' ? { period: 'yearly', year: filter.year } : filter;
  const { data, isLoading, isError, refetch } = useTaxSummary(params);

  const tableRows = (data?.invoices ?? []).map((inv) => ({
    'Invoice #': inv.invoiceNumber,
    Customer: inv.customerName,
    'Issue Date': fmtDate(inv.issueDate),
    Status: inv.status,
    Subtotal: inv.subtotal,
    'Tax Rate': `${inv.taxRate}%`,
    'Tax Amount': inv.taxAmount,
    Total: inv.total,
    Currency: inv.currency,
  }));

  return (
    <div className="space-y-4">
      {data && (
        <div className="rounded-xl border border-slate-100 bg-indigo-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Total Tax Collected</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700 tabular-nums">{fmt(parseFloat(data.totalTaxCollected))}</p>
        </div>
      )}
      <ReportShell
        title="Tax Summary"
        controls={<PeriodFilter value={filter} onChange={setFilter} />}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        tableHeaders={['Invoice #','Customer','Issue Date','Status','Subtotal','Tax Rate','Tax Amount','Total','Currency']}
        tableRows={tableRows}
        extraActions={
          <button type="button" onClick={() => window.print()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Print
          </button>
        }
        chartContent={
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.trend ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52}
                tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v) => [fmt(v), 'Tax Collected']} />
              <Bar dataKey="total" name="Tax Collected" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        }
      />
    </div>
  );
}
