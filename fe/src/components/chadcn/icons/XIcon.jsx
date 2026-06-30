import PropTypes from 'prop-types';

export default function XIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

XIcon.propTypes = {
  className: PropTypes.string,
};
