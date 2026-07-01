export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CONTRACT_TYPE_LABELS = {
  time_and_materials: 'T&M',
  fixed_price: 'Fixed',
  retainer: 'Retainer',
};

export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export function formatAmount(amount, currency) {
  if (amount == null) return '—';
  const n = parseFloat(amount);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ''}`.trim();
}

export function balanceClass(balance) {
  const n = parseFloat(balance);
  if (n > 0) return 'text-emerald-600 font-semibold';
  if (n < 0) return 'text-rose-600 font-semibold';
  return 'text-slate-500';
}
