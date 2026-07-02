import { useQuery } from '@tanstack/react-query';
import { getBillingOverview } from '@/features/billing/services/billingApi';

export default function useBillingOverview(params) {
  return useQuery(['billing-overview', params], () => getBillingOverview(params), {
    keepPreviousData: true,
  });
}
