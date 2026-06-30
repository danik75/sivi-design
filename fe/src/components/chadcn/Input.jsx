import PropTypes from 'prop-types';
import React from 'react';

const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`mt-1 block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      {...props}
    />
  );
});

Input.propTypes = {
  className: PropTypes.string,
};

export default Input;
