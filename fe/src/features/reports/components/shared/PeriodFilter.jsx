import PropTypes from 'prop-types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();

export default function PeriodFilter({ value, onChange }) {
  const { period, year, month, from, to } = value;

  function set(patch) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {['monthly', 'yearly', 'range'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set({ period: p })}
            className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
              period === p
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {period === 'monthly' && (
        <>
          <select
            value={month}
            onChange={(e) => set({ month: parseInt(e.target.value, 10) })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => set({ year: parseInt(e.target.value, 10) })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      {period === 'yearly' && (
        <select
          value={year}
          onChange={(e) => set({ year: parseInt(e.target.value, 10) })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
        >
          {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}

      {period === 'range' && (
        <>
          <input
            type="date"
            value={from ?? ''}
            onChange={(e) => set({ from: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={to ?? ''}
            onChange={(e) => set({ to: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          />
        </>
      )}
    </div>
  );
}

PeriodFilter.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
