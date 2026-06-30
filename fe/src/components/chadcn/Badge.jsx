import PropTypes from 'prop-types';

const BADGE_VARIANTS = {
  default: 'bg-slate-100 text-slate-600',
  primary: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default}`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary']),
};
