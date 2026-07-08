import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSubscription,
  deactivateSubscription,
  getSubscriptionSummary,
  getSubscriptions,
  updateSubscription,
} from '@/features/expenses/services/subscriptionsApi';

export function useSubscriptions({ status } = {}) {
  return useQuery(['subscriptions', status], () => getSubscriptions({ status }), {
    keepPreviousData: true,
  });
}

export function useSubscriptionSummary() {
  return useQuery(['subscriptions-summary'], getSubscriptionSummary, { keepPreviousData: true });
}

function useInvalidateSubscriptions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions-summary'] });
  };
}

export function useCreateSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation(createSubscription, { onSuccess: invalidate });
}

export function useUpdateSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation(updateSubscription, { onSuccess: invalidate });
}

export function useDeactivateSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation(deactivateSubscription, { onSuccess: invalidate });
}
