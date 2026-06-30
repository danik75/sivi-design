import PropTypes from 'prop-types';

export default function Button({ children, className = '', ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
