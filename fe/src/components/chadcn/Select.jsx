import PropTypes from 'prop-types';
import React from 'react';

const Select = React.forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Select;
