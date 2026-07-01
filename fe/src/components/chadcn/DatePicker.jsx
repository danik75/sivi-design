import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function fmt(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseVal(str) {
  if (!str) return null;
  if (str.includes('T')) {
    const dt = new Date(str);
    return isNaN(dt.getTime()) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  const [y, m, d] = str.split('-').map(Number);
  if (!y || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', id }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const parsed = parseVal(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(day) {
    onChange(toStr(viewYear, viewMonth, day));
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange('');
  }

  // Build 42-cell grid (6 weeks × 7 days)
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedStr = value || '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <span className={parsed ? 'text-slate-900' : 'text-slate-400'}>
          {parsed ? fmt(parsed) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {parsed ? (
            <span
              role="button"
              tabIndex={0}
              onMouseDown={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear date"
            >
              ×
            </span>
          ) : null}
          {/* Calendar icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {/* Popover */}
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="mb-1 grid grid-cols-7">
            {DOW.map((d) => (
              <div key={d} className="py-0.5 text-center text-xs font-medium text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={idx} />;
              }
              const cellStr = toStr(viewYear, viewMonth, day);
              const isToday = cellStr === todayStr;
              const isSelected = cellStr === selectedStr;

              let cls =
                'flex h-7 w-7 items-center justify-center rounded-full text-xs cursor-pointer mx-auto transition-colors';

              if (isSelected) {
                cls += ' bg-indigo-600 text-white font-semibold';
              } else if (isToday) {
                cls += ' ring-2 ring-indigo-400 text-indigo-700 font-semibold hover:bg-indigo-50';
              } else {
                cls += ' text-slate-700 hover:bg-slate-100';
              }

              return (
                <div key={idx} className="py-0.5">
                  <div
                    className={cls}
                    onClick={() => handleDayClick(day)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDayClick(day)}
                  >
                    {day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

DatePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  id: PropTypes.string,
};
