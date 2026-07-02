import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';

export default function Dropdown({ value, onChange, options, placeholder = 'Select…', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[70] mt-1 min-w-full overflow-hidden rounded-lg border border-slate-100 bg-white shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 ${
                String(o.value) === String(value) ? 'font-semibold text-indigo-600' : 'text-slate-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Dropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), label: PropTypes.string })
  ).isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};
