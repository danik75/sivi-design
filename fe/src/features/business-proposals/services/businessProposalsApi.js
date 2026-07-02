import api from '@/services/api';

export const getBusinessProposals = (params) =>
  api.get('/business-proposals', { params }).then((r) => r.data);
export const getBusinessProposal = (id) => api.get(`/business-proposals/${id}`).then((r) => r.data);
export const createBusinessProposal = (data) =>
  api.post('/business-proposals', data).then((r) => r.data);
export const resubmitBusinessProposal = (id) =>
  api.patch(`/business-proposals/${id}/resubmit`).then((r) => r.data);
export const refineBusinessProposal = (id, refinementText) =>
  api.patch(`/business-proposals/${id}/refine`, { refinementText }).then((r) => r.data);
export const updateBusinessProposalLifecycle = (id, lifecycleStatus) =>
  api
    .patch(`/business-proposals/${id}/lifecycle`, { lifecycleStatus })
    .then((r) => r.data);
export const deleteBusinessProposal = (id) =>
  api.delete(`/business-proposals/${id}`).then((r) => r.data);
