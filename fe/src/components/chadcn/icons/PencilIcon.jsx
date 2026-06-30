import PropTypes from 'prop-types';

export default function PencilIcon({ className = 'h-4 w-4', ...rest }) {
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
      <path d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.55 17.738l-4.2 1.23 1.23-4.2L16.862 3.487Z" />
    </svg>
  );
}

PencilIcon.propTypes = {
  className: PropTypes.string,
};
