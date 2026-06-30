import PropTypes from 'prop-types';

export default function TrashIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M19 7H5m2 0V5a1 1 0 011-1h8a1 1 0 011 1v2m-8 4v6m4-6v6m4-10v10a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10Z" />
    </svg>
  );
}

TrashIcon.propTypes = {
  className: PropTypes.string,
};
