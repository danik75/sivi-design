import { useQuery } from '@tanstack/react-query';
import { getBillingTrend } from '@/features/billing/services/billingApi';

export default function useBillingTrend(params) {
  return useQuery(['billing-trend', params], () => getBillingTrend(params), {
    keepPreviousData: true,
  });
}
