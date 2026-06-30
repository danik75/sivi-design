import PropTypes from 'prop-types';

function Table({ children }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{children}</thead>
  );
}

function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-50">{children}</tbody>;
}

function TableRow({ children, onClick, onDoubleClick }) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/60${(onClick || onDoubleClick) ? ' cursor-pointer' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </tr>
  );
}

function TableHeader({ children }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}

function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3 text-left text-slate-700 ${className}`}>{children}</td>;
}

const childrenProp = PropTypes.node;

Table.propTypes = {
  children: childrenProp,
};

TableHead.propTypes = {
  children: childrenProp,
};

TableBody.propTypes = {
  children: childrenProp,
};

TableRow.propTypes = {
  children: childrenProp,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
};

TableHeader.propTypes = {
  children: childrenProp,
};

TableCell.propTypes = {
  children: childrenProp,
  className: PropTypes.string,
};

export { TableHead, TableBody, TableRow, TableHeader, TableCell };
export default Table;
