import PropTypes from 'prop-types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '@/features/billing/constants';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, currency, pct } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-900">{name}</p>
      <p className="text-slate-500">
        {parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency} · {pct}
        %
      </p>
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

export default function IncomeChart({ customers, onSliceClick }) {
  if (!customers?.length) return null;

  // Use the first currency of each customer for the chart (dominant currency approach)
  const data = customers.map((c, i) => {
    const first = c.currencies[0];
    return {
      name: c.customerName,
      customerId: c.customerId,
      value: parseFloat(first?.paidInvoicesTotal ?? 0),
      currency: first?.currency ?? '',
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const total = data.reduce((s, d) => s + d.value, 0);
  const dataWithPct = data.map((d) => ({
    ...d,
    pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0',
  }));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Income Distribution
      </p>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPct}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) => onSliceClick(entry.customerId)}
                style={{ cursor: 'pointer' }}
              >
                {dataWithPct.map((entry) => (
                  <Cell key={entry.customerId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {dataWithPct.map((entry) => (
            <li key={entry.customerId} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <button
                type="button"
                onClick={() => onSliceClick(entry.customerId)}
                className="text-slate-700 hover:text-indigo-600 hover:underline"
              >
                {entry.name}
              </button>
              <span className="text-slate-400">{entry.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

IncomeChart.propTypes = {
  customers: PropTypes.array.isRequired,
  onSliceClick: PropTypes.func.isRequired,
};
