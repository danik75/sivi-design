import PropTypes from 'prop-types';
import React from 'react';

const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    />
  );
});

Input.propTypes = {
  className: PropTypes.string,
};

export default Input;
