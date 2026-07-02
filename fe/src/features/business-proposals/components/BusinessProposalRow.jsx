import PropTypes from 'prop-types';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
import EyeIcon from '@/components/chadcn/icons/EyeIcon';
import TrashIcon from '@/components/chadcn/icons/TrashIcon';
import { TableCell, TableRow } from '@/components/chadcn/Table';
import {
  BUSINESS_PROPOSALS_TEXT,
  getLifecycleVariant,
  getStatusVariant,
} from '@/features/business-proposals/constants';

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : BUSINESS_PROPOSALS_TEXT.placeholder;

export default function BusinessProposalRow({
  proposal,
  onView,
  onResubmit,
  onUpdateLifecycle,
  onDelete,
}) {
  return (
    <TableRow>
      <TableCell>{proposal.customerName || BUSINESS_PROPOSALS_TEXT.placeholder}</TableCell>
      <TableCell>{proposal.pricingModelLabel || BUSINESS_PROPOSALS_TEXT.placeholder}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(proposal.status)}>
          {BUSINESS_PROPOSALS_TEXT.status[proposal.status] ?? proposal.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getLifecycleVariant(proposal.lifecycleStatus)}>
          {BUSINESS_PROPOSALS_TEXT.lifecycle[proposal.lifecycleStatus] ??
            proposal.lifecycleStatus}
        </Badge>
      </TableCell>
      <TableCell>{formatDateTime(proposal.createdAt)}</TableCell>
      <TableCell>{formatDateTime(proposal.completedAt)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {proposal.lifecycleStatus !== 'accepted' ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onUpdateLifecycle(proposal, 'accepted')}
            >
              {BUSINESS_PROPOSALS_TEXT.rowActions.accept}
            </Button>
          ) : null}
          {proposal.lifecycleStatus !== 'rejected' ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onUpdateLifecycle(proposal, 'rejected')}
            >
              {BUSINESS_PROPOSALS_TEXT.rowActions.reject}
            </Button>
          ) : null}
          {proposal.lifecycleStatus !== 'sent' ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onUpdateLifecycle(proposal, 'sent')}
            >
              {BUSINESS_PROPOSALS_TEXT.rowActions.markSent}
            </Button>
          ) : null}
          {proposal.status === 'failed' ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onResubmit(proposal)}
            >
              {BUSINESS_PROPOSALS_TEXT.rowActions.resubmit}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            className="h-8 w-8 !p-0"
            onClick={() => onDelete(proposal)}
            aria-label={BUSINESS_PROPOSALS_TEXT.rowActions.delete}
          >
            <TrashIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 !p-0"
            onClick={() => onView(proposal)}
            aria-label={BUSINESS_PROPOSALS_TEXT.rowActions.view}
          >
            <EyeIcon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

BusinessProposalRow.propTypes = {
  proposal: PropTypes.shape({
    id: PropTypes.string.isRequired,
    customerName: PropTypes.string,
    pricingModelLabel: PropTypes.string,
    status: PropTypes.string.isRequired,
    lifecycleStatus: PropTypes.string,
    createdAt: PropTypes.string,
    completedAt: PropTypes.string,
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onResubmit: PropTypes.func.isRequired,
  onUpdateLifecycle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
