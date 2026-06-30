import PropTypes from 'prop-types';

export default function MenuIcon({ className = 'h-4 w-4', ...rest }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

MenuIcon.propTypes = {
  className: PropTypes.string,
};
