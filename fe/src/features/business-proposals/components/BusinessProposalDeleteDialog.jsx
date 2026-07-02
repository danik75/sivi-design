import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
} from '@/features/business-proposals/constants';
import useDeleteBusinessProposal from '@/features/business-proposals/hooks/useDeleteBusinessProposal';

export default function BusinessProposalDeleteDialog({
  isOpen,
  onClose,
  proposal,
  onSuccess,
}) {
  const deleteMutation = useDeleteBusinessProposal();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeleting = deleteMutation.isLoading || deleteMutation.isPending;
  const customerName = proposal?.customerName || 'this customer';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deleteMutation.reset();
    }
  }, [deleteMutation, isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {BUSINESS_PROPOSALS_TEXT.deleteDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeleting || !proposal?.id}
          onClick={() => {
            if (!proposal?.id) {
              return;
            }

            setErrorMessage('');
            deleteMutation.mutate(proposal.id, {
              onSuccess: () => {
                onSuccess(proposal);
                onClose();
              },
              onError: (error) =>
                setErrorMessage(
                  getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.deleteDialog.error),
                ),
            });
          }}
        >
          {BUSINESS_PROPOSALS_TEXT.deleteDialog.confirm}
        </Button>
      </>
    ),
    [deleteMutation, isDeleting, onClose, onSuccess, proposal],
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={BUSINESS_PROPOSALS_TEXT.deleteDialog.title}
      footer={footer}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {BUSINESS_PROPOSALS_TEXT.deleteDialog.description.replace(
            '{{customerName}}',
            customerName,
          )}
        </p>
        {errorMessage ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

BusinessProposalDeleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  proposal: PropTypes.shape({
    id: PropTypes.string,
    customerName: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

BusinessProposalDeleteDialog.defaultProps = {
  proposal: null,
};
