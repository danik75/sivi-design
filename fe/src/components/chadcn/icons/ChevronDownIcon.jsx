import PropTypes from 'prop-types';

export default function ChevronDownIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

ChevronDownIcon.propTypes = {
  className: PropTypes.string,
};
