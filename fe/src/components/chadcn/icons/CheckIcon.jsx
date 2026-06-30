import PropTypes from 'prop-types';

export default function CheckIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

CheckIcon.propTypes = {
  className: PropTypes.string,
};
