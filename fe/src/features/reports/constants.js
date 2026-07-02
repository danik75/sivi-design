export const REPORT_GROUPS = [
  {
    label: 'Customer-facing',
    reports: [
      { id: 'customer-statement', label: 'Customer Statement' },
      { id: 'project-status',     label: 'Project Status' },
    ],
  },
  {
    label: 'Accountant / Tax',
    reports: [
      { id: 'pl',          label: 'P&L Statement' },
      { id: 'tax-summary', label: 'Tax Summary' },
      { id: 'ar-aging',    label: 'AR Aging' },
    ],
  },
  {
    label: 'Business Intelligence',
    reports: [
      { id: 'revenue-breakdown',       label: 'Revenue Breakdown' },
      { id: 'customer-profitability',  label: 'Customer Profitability' },
      { id: 'forecast',                label: 'Revenue Forecast' },
      { id: 'expense-analysis',        label: 'Expense Analysis' },
    ],
  },
];

export const CHART_COLORS = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
];

export const AGING_BUCKETS = [
  { key: 'current',     label: 'Current',    color: '#94a3b8' },
  { key: 'days1to30',   label: '1–30 days',  color: '#f59e0b' },
  { key: 'days31to60',  label: '31–60 days', color: '#f97316' },
  { key: 'days61to90',  label: '61–90 days', color: '#ef4444' },
  { key: 'days90plus',  label: '90+ days',   color: '#991b1b' },
];

export const BUCKET_COLOR = Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, b.color]));
export const BUCKET_LABEL = Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, b.label]));

export const MARGIN_COLOR = (pct) => {
  const n = parseFloat(pct);
  if (n >= 70) return 'text-emerald-600';
  if (n >= 40) return 'text-amber-600';
  return 'text-rose-600';
};

export const fmt = (v, currency = '') =>
  `${parseFloat(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}${currency ? ' ' + currency : ''}`;

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
