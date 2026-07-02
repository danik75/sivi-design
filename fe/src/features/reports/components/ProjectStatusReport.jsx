import { useState } from 'react';
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
import { useProjectStatus } from '@/features/reports/hooks';
import ReportShell from './shared/ReportShell';

const STATUS_COLORS = {
  todo: '#94a3b8',
  in_progress: '#6366f1',
  done: '#10b981',
  cancelled: '#ef4444',
};
const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export default function ProjectStatusReport({ customers = [] }) {
  const [customerId, setCustomerId] = useState('');
  const params = customerId ? { customerId } : {};
  const { data, isLoading, isError, refetch } = useProjectStatus(params);

  const summary = data?.summary;
  const statusChart = summary
    ? Object.keys(STATUS_COLORS).map((k) => ({
        name: STATUS_LABELS[k],
        count: summary[k] ?? 0,
        color: STATUS_COLORS[k],
      }))
    : [];

  const completionChart = (data?.byCustomer ?? []).map((c) => ({
    name: c.customerName,
    avg: parseFloat(c.avgCompletion),
    tasks: c.tasks.length,
  }));

  const tableRows = (data?.byCustomer ?? []).flatMap((c) =>
    c.tasks.map((t) => ({
      Customer: c.customerName,
      Task: t.name,
      Status: STATUS_LABELS[t.status] ?? t.status,
      'Start Date': t.startDate ?? '—',
      'End Date': t.endDate ?? '—',
      'Est. Hours': t.estimatedHours ?? '—',
      'Complete %': `${t.percentComplete}%`,
    }))
  );

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, cls: 'text-slate-900' },
            { label: 'To Do', value: summary.todo, cls: 'text-slate-500' },
            { label: 'In Progress', value: summary.in_progress, cls: 'text-indigo-600' },
            { label: 'Done', value: summary.done, cls: 'text-emerald-600' },
            { label: 'Avg Complete', value: `${summary.avgCompletion}%`, cls: 'text-amber-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
      <ReportShell
        title="Project Status"
        controls={
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        }
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tableHeaders={[
          'Customer',
          'Task',
          'Status',
          'Start Date',
          'End Date',
          'Est. Hours',
          'Complete %',
        ]}
        tableRows={tableRows}
        chartContent={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Status Distribution
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip formatter={(v) => [v, 'Tasks']} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {statusChart.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Avg Completion by Customer
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={completionChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                    width={36}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(v, n) => (n === 'avg' ? [`${v}%`, 'Avg Completion'] : [v, 'Tasks'])}
                  />
                  <Bar dataKey="avg" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        }
      />
    </div>
  );
}
