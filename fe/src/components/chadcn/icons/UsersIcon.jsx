import PropTypes from 'prop-types';

export default function UsersIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3" />
      <path d="M19 16c0-1.5-1.5-2.5-3-3" />
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.686-5 6-5s6 2 6 5" />
    </svg>
  );
}

UsersIcon.propTypes = {
  className: PropTypes.string,
};
