import { useRef, useState } from 'react';
import ClipboardIcon from '@/components/chadcn/icons/ClipboardIcon';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt, fmtDate } from '@/features/reports/constants';
import { useCustomerStatement } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
const DEFAULT_FILTER = { period: 'yearly', year: now.getFullYear() };

export default function CustomerStatementReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');
  const [emailLabel, setEmailLabel] = useState('Send to Customer');
  const resetRef = useRef(null);

  const params =
    filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : { period: 'monthly', year: filter.year, month: filter.month };

  const { data, isLoading, isError, refetch } = useCustomerStatement(customerId || null, params);

  const chartData = (data?.entries ?? []).map((e, i) => ({
    i,
    label: fmtDate(e.date),
    balance: parseFloat(e.runningBalance),
  }));

  const tableRows = (data?.entries ?? []).map((e) => ({
    Date: fmtDate(e.date),
    Type: e.type,
    Reference: e.reference,
    Description: e.description,
    Amount: e.amount,
    Balance: e.runningBalance,
    Status: e.status,
  }));

  async function handleSend() {
    if (!data) return;
    const html = `<html><body style="font-family:Arial,sans-serif;padding:2rem">
      <h2>Account Statement — ${data.customerName}</h2>
      <p>Period: ${data.period.from} – ${data.period.to}</p>
      <p>Closing Balance: ${data.closingBalance}</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
        <tr>${['Date', 'Type', 'Reference', 'Description', 'Amount', 'Balance'].map((h) => `<th>${h}</th>`).join('')}</tr>
        ${data.entries
          .map(
            (e) => `<tr>
          <td>${fmtDate(e.date)}</td><td>${e.type}</td><td>${e.reference}</td>
          <td>${e.description}</td><td>${e.amount}</td><td>${e.runningBalance}</td>
        </tr>`
          )
          .join('')}
      </table></body></html>`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) }),
      ]);
    } catch {
      await navigator.clipboard.writeText(html).catch(() => {});
    }
    const to = encodeURIComponent('');
    const su = encodeURIComponent(`Account Statement — ${data.customerName}`);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}`,
      '_blank',
      'noopener,noreferrer'
    );
    setEmailLabel('Paste in Gmail (⌘V)');
    clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setEmailLabel('Send to Customer'), 4000);
  }

  return (
    <ReportShell
      title="Customer Statement"
      controls={
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <PeriodFilter value={filter} onChange={setFilter} />
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      tableHeaders={['Date', 'Type', 'Reference', 'Description', 'Amount', 'Balance', 'Status']}
      tableRows={tableRows}
      extraActions={
        <button
          type="button"
          onClick={handleSend}
          disabled={!data}
          aria-label={emailLabel}
          title={emailLabel}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ClipboardIcon className="h-4 w-4" />
        </button>
      }
      chartContent={
        data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Opening Balance', value: data.openingBalance },
                { label: 'Closing Balance', value: data.closingBalance, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p
                    className={`mt-1 text-lg font-bold tabular-nums ${highlight && parseFloat(value) >= 0 ? 'text-emerald-600' : highlight ? 'text-rose-600' : 'text-slate-900'}`}
                  >
                    {fmt(parseFloat(value))}
                  </p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip formatter={(v) => [fmt(v), 'Balance']} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Area
                  dataKey="balance"
                  stroke="#6366f1"
                  fill="#e0e7ff"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">
            Select a customer to view the statement.
          </p>
        )
      }
    />
  );
}
