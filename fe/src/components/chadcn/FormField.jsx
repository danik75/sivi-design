import PropTypes from 'prop-types';

export default function FormField({ label, children, hint, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-sm text-gray-600 mb-1">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.node,
  children: PropTypes.node,
  hint: PropTypes.node,
  className: PropTypes.string,
};
