import PropTypes from 'prop-types';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function fmt(v) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(0);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-500">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums" style={{ color: p.color }}>
            {parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

export default function ProfitabilityChart({ data, isLoading }) {
  const chartData = (data ?? []).map((d) => ({
    label: d.label,
    Income: parseFloat(d.paidTotal),
    Expenses: parseFloat(d.expensesTotal),
    Balance: parseFloat(d.balance),
  }));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Profitability Trend
      </p>

      {isLoading ? (
        <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
            <Bar dataKey="Income" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Line
              dataKey="Balance"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

ProfitabilityChart.propTypes = {
  data: PropTypes.array,
  isLoading: PropTypes.bool,
};
