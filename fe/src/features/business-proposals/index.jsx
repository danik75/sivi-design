import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import BusinessProposalDeleteDialog from '@/features/business-proposals/components/BusinessProposalDeleteDialog';
import BusinessProposalDetailModal from '@/features/business-proposals/components/BusinessProposalDetailModal';
import BusinessProposalGrid from '@/features/business-proposals/components/BusinessProposalGrid';
import BusinessProposalModal from '@/features/business-proposals/components/BusinessProposalModal';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
} from '@/features/business-proposals/constants';
import useResubmitBusinessProposal from '@/features/business-proposals/hooks/useResubmitBusinessProposal';
import useUpdateBusinessProposalLifecycle from '@/features/business-proposals/hooks/useUpdateBusinessProposalLifecycle';

export default function BusinessProposalsFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const resubmitMutation = useResubmitBusinessProposal();
  const lifecycleMutation = useUpdateBusinessProposalLifecycle();

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
  };

  const handleResubmit = (proposal) => {
    resubmitMutation.mutate(proposal.id, {
      onSuccess: () => showToast(BUSINESS_PROPOSALS_TEXT.success.resubmitted, 'success'),
      onError: (error) =>
        showToast(
          getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.modal.saveError),
          'error',
        ),
    });
  };

  const handleUpdateLifecycle = (proposal, lifecycleStatus) => {
    lifecycleMutation.mutate(
      { id: proposal.id, lifecycleStatus },
      {
        onSuccess: () =>
          showToast(BUSINESS_PROPOSALS_TEXT.success.lifecycleUpdated, 'success'),
        onError: (error) =>
          showToast(
            getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.modal.saveError),
            'error',
          ),
      },
    );
  };

  const handleDelete = (proposal) => setProposalToDelete(proposal);

  const handleDeleteSuccess = (deletedProposal) => {
    showToast(BUSINESS_PROPOSALS_TEXT.success.deleted, 'success');
    if (selectedProposal?.id === deletedProposal?.id) {
      setSelectedProposal(null);
    }
  };

  return (
    <>
      <BusinessProposalGrid
        onCreate={() => setShowCreate(true)}
        onView={(proposal) => setSelectedProposal(proposal)}
        onResubmit={handleResubmit}
        onUpdateLifecycle={handleUpdateLifecycle}
        onDelete={handleDelete}
      />
      <BusinessProposalModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleSuccess}
      />
      <BusinessProposalDetailModal
        proposalId={selectedProposal?.id}
        isOpen={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
      />
      <BusinessProposalDeleteDialog
        isOpen={Boolean(proposalToDelete)}
        proposal={proposalToDelete}
        onClose={() => setProposalToDelete(null)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
