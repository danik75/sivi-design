import PropTypes from 'prop-types';

export default function Form({ children, onSubmit, className = '', ...rest }) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`} {...rest}>
      {children}
    </form>
  );
}

Form.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  className: PropTypes.string,
};
