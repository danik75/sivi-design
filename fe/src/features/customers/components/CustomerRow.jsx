import PropTypes from 'prop-types';
import Badge from '../../../components/chadcn/Badge';
import Button from '../../../components/chadcn/Button';
import { TableCell, TableRow } from '../../../components/chadcn/Table';
import { CUSTOMER_TEXT, getPrimaryContact } from '../constants';

export default function CustomerRow({ customer, onEdit, onDelete }) {
  const primaryContact = getPrimaryContact(customer);
  const contactCount = customer.contacts?.length ?? 0;

  return (
    <TableRow>
      <TableCell className="font-semibold text-slate-900">{customer.name}</TableCell>
      <TableCell>{primaryContact.email || CUSTOMER_TEXT.placeholder}</TableCell>
      <TableCell>{primaryContact.phone || CUSTOMER_TEXT.placeholder}</TableCell>
      <TableCell>
        <Badge variant="primary">{String(contactCount)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-2"
            onClick={() => onEdit(customer)}
            aria-label={CUSTOMER_TEXT.rowActions.edit}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.55 17.738l-4.2 1.23 1.23-4.2L16.862 3.487Z"
              />
            </svg>
          </Button>
          <Button
            type="button"
            variant="danger"
            className="px-3 py-2"
            onClick={() => onDelete(customer)}
            aria-label={CUSTOMER_TEXT.rowActions.delete}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7H5m2 0V5a1 1 0 011-1h8a1 1 0 011 1v2m-8 4v6m4-6v6m4-10v10a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10Z"
              />
            </svg>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

CustomerRow.propTypes = {
  customer: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    contacts: PropTypes.arrayOf(
      PropTypes.shape({
        email: PropTypes.string,
        phone: PropTypes.string,
        isPrimary: PropTypes.bool,
      })
    ),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
