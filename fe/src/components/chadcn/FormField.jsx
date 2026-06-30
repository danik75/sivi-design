import PropTypes from 'prop-types';

export default function FormField({ label, children, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.node,
  children: PropTypes.node,
  hint: PropTypes.node,
  className: PropTypes.string,
};
