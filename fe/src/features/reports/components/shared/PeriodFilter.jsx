import PropTypes from 'prop-types';
import DatePicker from '@/components/chadcn/DatePicker';
import Dropdown from '@/components/chadcn/Dropdown';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = now.getFullYear() - i;
  return { value: y, label: String(y) };
});

const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

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
          <div className="w-28">
            <Dropdown value={month} onChange={(v) => set({ month: Number(v) })} options={MONTH_OPTIONS} />
          </div>
          <div className="w-24">
            <Dropdown value={year} onChange={(v) => set({ year: Number(v) })} options={YEAR_OPTIONS} />
          </div>
        </>
      )}

      {period === 'yearly' && (
        <div className="w-24">
          <Dropdown value={year} onChange={(v) => set({ year: Number(v) })} options={YEAR_OPTIONS} />
        </div>
      )}

      {period === 'range' && (
        <>
          <div className="w-36">
            <DatePicker value={from ?? ''} onChange={(v) => set({ from: v })} placeholder="From date" />
          </div>
          <span className="text-slate-400 text-xs">to</span>
          <div className="w-36">
            <DatePicker value={to ?? ''} onChange={(v) => set({ to: v })} placeholder="To date" />
          </div>
        </>
      )}
    </div>
  );
}

PeriodFilter.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
