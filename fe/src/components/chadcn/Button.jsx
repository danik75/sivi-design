import PropTypes from 'prop-types';

export default function Button({ children, className = '', variant = 'primary', ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg focus:ring-indigo-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    danger: 'bg-transparent text-rose-600 hover:bg-rose-50 focus:ring-rose-400',
  };

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'ghost', 'danger']),
};
