export const PRICING_MODELS = [
  { value: 'fixed_fee', label: 'Fixed Fee' },
  { value: 'time_and_materials', label: 'Time & Materials' },
  { value: 'capped_hours_bundle', label: 'Capped Hours Bundle' },
  { value: 'monthly_retainer', label: 'Monthly Retainer' },
];

export const PROPOSAL_STATUSES = [
  { value: 'queued', label: 'Queued' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export const PROPOSAL_LIFECYCLE_STATUSES = [
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export function getApiErrorMessage(error, fallback) {
  const message = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message || fallback;
}

export function getStatusVariant(status) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'in_progress':
      return 'primary';
    default:
      return 'default';
  }
}

export function getLifecycleVariant(status) {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'primary';
  }
}

export const BUSINESS_PROPOSALS_TEXT = {
  title: 'Business Proposals',
  description: 'Generate bilingual business proposals with AI-assisted intake.',
  addProposal: 'New Business Proposal',
  loading: 'Loading business proposals...',
  loadError: 'Unable to load business proposals.',
  retry: 'Retry',
  clearFilters: 'Clear filters',
  noDataTitle: 'No business proposals yet',
  noDataDescription: 'Start a new proposal to generate an English and Hebrew version.',
  noResultsTitle: 'No matching proposals',
  noResultsDescription: 'Try changing customer or status filters.',
  placeholder: '—',
  status: {
    queued: 'Queued',
    in_progress: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
  },
  lifecycle: {
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
  },
  headers: {
    customer: 'Customer',
    pricingModel: 'Pricing Model',
    status: 'Status',
    lifecycle: 'Lifecycle',
    createdAt: 'Created',
    completedAt: 'Completed',
    actions: 'Actions',
  },
  filters: {
    customerLabel: 'Customer',
    customerPlaceholder: 'All customers',
    customerLoading: 'Loading customers...',
    customerError: 'Unable to load customers.',
    statusLabel: 'Status',
    statusPlaceholder: 'All statuses',
  },
  rowActions: {
    view: 'View',
    resubmit: 'Resubmit',
    accept: 'Accept',
    reject: 'Reject',
    markSent: 'Mark Sent',
    delete: 'Delete',
  },
  deleteDialog: {
    title: 'Delete business proposal',
    description:
      'This will permanently delete the proposal for {{customerName}}. This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Delete proposal',
    error: 'Unable to delete proposal.',
  },
  modal: {
    title: 'New Business Proposal',
    intro: 'Fill in the details below and generate the proposal.',
    customerLabel: 'Customer',
    customerPlaceholder: 'Select a customer',
    requirementLabel: 'Business requirement',
    requirementPlaceholder: 'Describe goals, scope, constraints, and expected outcomes...',
    pricingLabel: 'Pricing model',
    pricingPlaceholder: 'Select a pricing model',
    estimatedHoursLabel: 'Estimated hours',
    estimatedHoursPlaceholder: '220',
    hourlyRateLabel: 'Hourly rate',
    hourlyRatePlaceholder: '350',
    currencyLabel: 'Currency',
    paymentLabel: 'Payment distribution',
    paymentPlaceholder: '30% upfront, 40% on milestone, 30% on delivery',
    cancel: 'Cancel',
    submit: 'Generate Proposal',
    saveError: 'Unable to create proposal.',
    requiredCustomer: 'Customer is required.',
    requiredBusinessRequirement: 'Business requirement is required.',
    requiredPricingModel: 'Pricing model is required.',
    requiredPaymentDistribution: 'Payment distribution is required.',
    requiredEstimatedHours: 'Estimated hours are required for this pricing model.',
    requiredHourlyRate: 'Hourly rate is required for this pricing model.',
  },
  detail: {
    title: 'Business Proposal',
    englishTab: 'English',
    hebrewTab: 'Hebrew',
    copy: 'Copy to Clipboard',
    copied: 'Proposal copied to clipboard.',
    copyFailed: 'Unable to copy proposal to clipboard.',
    refineLabel: 'Refinement instructions',
    refinePlaceholder: 'Describe what to improve in this proposal...',
    refine: 'Refine with AI',
    refineRequired: 'Refinement text is required.',
    refineQueued: 'Proposal refinement queued.',
    refineError: 'Unable to refine proposal.',
    downloadPdf: 'Download PDF',
    saveContent: 'Save Changes',
    saveSuccess: 'Proposal content saved.',
    saveError: 'Unable to save changes.',
    close: 'Close',
    loading: 'Loading proposal...',
    loadingGeneration: 'Proposal generation is in progress. This view updates automatically.',
    failed: 'Generation failed for this proposal.',
    generationErrorPrefix: 'Generation error:',
    sectionGreeting: 'Greeting',
    sectionIntro: 'Introduction',
    sectionProjectDescription: 'Project Description',
    sectionTimeline: 'Timeline',
    sectionPayment: 'Payment',
    sectionStructure: 'Project Structure',
    phaseLabel: 'Phase',
    durationLabel: 'Duration',
    tasksLabel: 'Tasks (one per line)',
    totalPriceLabel: 'Total Price',
    addPhase: '+ Add Phase',
    removePhase: 'Remove',
    addPaymentItem: '+ Add Payment Item',
    removePaymentItem: 'Remove',
    addStructureSection: '+ Add Section',
    removeStructureSection: 'Remove',
    addDeliverable: '+ Add Item',
    removeDeliverable: 'Remove',
  },
  success: {
    created: 'Business proposal request queued.',
    resubmitted: 'Failed proposal resubmitted.',
    lifecycleUpdated: 'Proposal lifecycle updated.',
    deleted: 'Proposal deleted.',
  },
};
