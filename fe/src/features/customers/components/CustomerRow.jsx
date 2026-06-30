import PropTypes from 'prop-types';
import Button from '@/components/chadcn/Button';
import PencilIcon from '@/components/chadcn/icons/PencilIcon';
import TrashIcon from '@/components/chadcn/icons/TrashIcon';
import { TableCell, TableRow } from '@/components/chadcn/Table';
import { CUSTOMER_TEXT, getPrimaryContact } from '@/features/customers/constants';

export default function CustomerRow({ customer, onEdit, onDelete }) {
  const primaryContact = getPrimaryContact(customer);

  return (
    <TableRow>
      <TableCell className="font-semibold text-slate-900">{customer.name}</TableCell>
      <TableCell>{primaryContact.email || CUSTOMER_TEXT.placeholder}</TableCell>
      <TableCell>{primaryContact.phone || CUSTOMER_TEXT.placeholder}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-2"
            onClick={() => onEdit(customer)}
            aria-label={CUSTOMER_TEXT.rowActions.edit}
          >
            <PencilIcon />
          </Button>
          <Button
            type="button"
            variant="danger"
            className="px-3 py-2"
            onClick={() => onDelete(customer)}
            aria-label={CUSTOMER_TEXT.rowActions.delete}
          >
            <TrashIcon />
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
