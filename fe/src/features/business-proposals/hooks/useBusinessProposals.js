import { useQuery } from '@tanstack/react-query';
import { getBusinessProposals } from '@/features/business-proposals/services/businessProposalsApi';

export default function useBusinessProposals({ customerId, status } = {}) {
  return useQuery(
    ['business-proposals', customerId, status],
    () => getBusinessProposals({ customerId, status }),
    {
      keepPreviousData: true,
      refetchInterval: (data) =>
        (data ?? []).some(
          (proposal) => proposal.status === 'queued' || proposal.status === 'in_progress'
        )
          ? 3000
          : false,
    }
  );
}
