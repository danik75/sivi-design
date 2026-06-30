import PropTypes from 'prop-types';

export default function Avatar({ initials = '?', className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold select-none ${className}`}
      aria-hidden="true"
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  );
}

Avatar.propTypes = {
  initials: PropTypes.string,
  className: PropTypes.string,
};
