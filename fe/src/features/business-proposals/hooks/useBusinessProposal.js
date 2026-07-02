import { useQuery } from '@tanstack/react-query';
import { getBusinessProposal } from '@/features/business-proposals/services/businessProposalsApi';

export default function useBusinessProposal(id, enabled = true) {
  return useQuery(['business-proposal', id], () => getBusinessProposal(id), {
    enabled: Boolean(id) && enabled,
    refetchInterval: (data) =>
      data && (data.status === 'queued' || data.status === 'in_progress') ? 3000 : false,
  });
}
