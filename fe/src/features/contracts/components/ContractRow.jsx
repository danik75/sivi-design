import PropTypes from 'prop-types';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
import XIcon from '@/components/chadcn/icons/XIcon';
import { TableCell, TableRow } from '@/components/chadcn/Table';
import {
  CONTRACT_TEXT,
  CONTRACT_TYPE_MAP,
  getStatusVariant,
  getTypeSpecificDetails,
} from '@/features/contracts/constants';

const formatDate = (iso) => {
  if (!iso) return CONTRACT_TEXT.placeholder;
  return new Date(iso).toLocaleDateString();
};

export default function ContractRow({ contract, onDeactivate }) {
  const typeLabel =
    contract.typeLabel || CONTRACT_TYPE_MAP[contract.type] || CONTRACT_TEXT.placeholder;
  const statusLabel =
    contract.status === 'active' ? CONTRACT_TEXT.status.active : CONTRACT_TEXT.status.inactive;

  return (
    <TableRow>
      <TableCell className="font-semibold text-slate-900">{contract.name}</TableCell>
      <TableCell>{typeLabel}</TableCell>
      <TableCell>{getTypeSpecificDetails(contract)}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(contract.status)}>{statusLabel}</Badge>
      </TableCell>
      <TableCell>{formatDate(contract.createdAt)}</TableCell>
      <TableCell>{formatDate(contract.expiresAt)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-2">
          {contract.status === 'active' ? (
            <Button
              type="button"
              variant="danger"
              className="h-8 w-8 !p-0 shrink-0"
              onClick={() => onDeactivate(contract)}
              aria-label={CONTRACT_TEXT.rowActions.deactivateLabel}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

ContractRow.propTypes = {
  contract: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    typeLabel: PropTypes.string,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    expiresAt: PropTypes.string,
    currency: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hourlyRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hoursPurchased: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amountPaid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    monthlyFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hoursPerMonth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onDeactivate: PropTypes.func.isRequired,
};
