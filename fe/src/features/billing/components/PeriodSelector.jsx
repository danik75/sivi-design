import PropTypes from 'prop-types';
import { MONTHS } from '@/features/billing/constants';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

export default function PeriodSelector({ period, year, month, onChange }) {
  const isCurrentPeriod =
    period === 'monthly' ? year === CURRENT_YEAR && month === CURRENT_MONTH : year === CURRENT_YEAR;

  function step(delta) {
    if (period === 'monthly') {
      let m = month + delta;
      let y = year;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      if (m > 12) {
        m = 1;
        y += 1;
      }
      onChange({ period, year: y, month: m });
    } else {
      onChange({ period, year: year + delta, month });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Monthly / Yearly toggle */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {['monthly', 'yearly'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange({ period: p, year, month })}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              period === p
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p === 'monthly' ? 'Monthly' : 'Yearly'}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          aria-label="Previous"
        >
          ‹
        </button>

        <span className="min-w-[130px] text-center text-sm font-medium text-slate-800">
          {period === 'monthly' ? `${MONTHS[month - 1]} ${year}` : String(year)}
          {isCurrentPeriod && (
            <span className="ml-1.5 text-xs font-normal text-indigo-500">· current</span>
          )}
        </span>

        <button
          type="button"
          onClick={() => step(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}

PeriodSelector.propTypes = {
  period: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
