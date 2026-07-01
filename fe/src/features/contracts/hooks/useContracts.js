import { useQuery } from '@tanstack/react-query';
import { getContracts } from '@/features/contracts/services/contractsApi';

export default function useContracts({ customerId, status } = {}) {
  return useQuery(['contracts', customerId, status], () => getContracts({ customerId, status }), {
    keepPreviousData: true,
  });
}
