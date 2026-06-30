import PropTypes from 'prop-types';

export default function Avatar({ initials = '?', className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold select-none shadow-sm ring-2 ring-white ${className}`}
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
