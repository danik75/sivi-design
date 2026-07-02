import PropTypes from 'prop-types';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
import XIcon from '@/components/chadcn/icons/XIcon';
import { TableCell, TableRow } from '@/components/chadcn/Table';
import {
  EXPENSE_CATEGORY_MAP,
  EXPENSE_TEXT,
  formatAmount,
  getStatusVariant,
} from '@/features/expenses/constants';

const formatDate = (iso) => {
  if (!iso) return EXPENSE_TEXT.placeholder;
  return new Date(iso).toLocaleDateString();
};

export default function ExpenseRow({ expense, onDeactivate }) {
  const categoryLabel =
    expense.categoryLabel || EXPENSE_CATEGORY_MAP[expense.category] || EXPENSE_TEXT.placeholder;
  const statusLabel =
    expense.status === 'active' ? EXPENSE_TEXT.status.active : EXPENSE_TEXT.status.inactive;

  return (
    <TableRow>
      <TableCell className="font-semibold text-slate-900">{expense.vendor}</TableCell>
      <TableCell>{categoryLabel}</TableCell>
      <TableCell>{formatAmount(expense.amount, expense.currency)}</TableCell>
      <TableCell>{expense.customerName || EXPENSE_TEXT.placeholder}</TableCell>
      <TableCell>{formatDate(expense.date)}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(expense.status)}>{statusLabel}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-2">
          {expense.status === 'active' ? (
            <Button
              type="button"
              variant="danger"
              className="h-8 w-8 !p-0 shrink-0"
              onClick={() => onDeactivate(expense)}
              aria-label={EXPENSE_TEXT.rowActions.deactivateLabel}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

ExpenseRow.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    vendor: PropTypes.string.isRequired,
    category: PropTypes.string,
    categoryLabel: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    customerName: PropTypes.string,
    date: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onDeactivate: PropTypes.func.isRequired,
};
