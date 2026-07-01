export const TASK_TEXT = {
  title: 'Tasks',
  description: 'Manage tasks, timelines, and progress.',
  addTask: 'Add Task',
  searchPlaceholder: 'Search tasks',
  loading: 'Loading tasks...',
  loadError: 'Unable to load tasks.',
  noDataTitle: 'No tasks yet',
  noDataDescription: 'Add your first task to start tracking work.',
  noResultsTitle: 'No matching tasks',
  noResultsDescription: 'Try a different search term or create a new task.',
  retry: 'Retry',
  clearSearch: 'Clear search',
  headers: {
    name: 'Name',
    customer: 'Customer',
    start: 'Start',
    end: 'End',
    status: 'Status',
    estimatedHours: 'Est. Hours',
    percentComplete: '% Complete',
    actions: 'Actions',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    label: (page, totalPages) => `Page ${page} of ${totalPages}`,
  },
  modal: {
    createTitle: 'Add Task',
    editTitle: 'Edit Task',
    nameLabel: 'Task Name',
    namePlaceholder: 'Enter task name',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Optional description',
    startDateLabel: 'Start Date',
    startTimeLabel: 'Start Time',
    startTimePlaceholder: 'Start of day',
    endDateLabel: 'End Date',
    endTimeLabel: 'End Time',
    endTimePlaceholder: 'End of day',
    statusLabel: 'Status',
    customerLabel: 'Customer',
    noCustomer: 'No customer',
    estimatedHoursLabel: 'Estimated Hours',
    estimatedHoursPlaceholder: '0.0',
    percentCompleteLabel: '% Complete',
    cancel: 'Cancel',
    createSubmit: 'Save Task',
    editSubmit: 'Save Changes',
    nameRequired: 'Task name is required.',
    startDateRequired: 'Start date is required.',
    endDateRequired: 'End date is required.',
    endDateBeforeStart: 'End date must be on or after start date.',
    saveError: 'Unable to save task.',
  },
  deleteDialog: {
    title: 'Delete Task',
    description: (name) => `Delete "${name}"? This action cannot be undone.`,
    cancel: 'Cancel',
    confirm: 'Delete',
    error: 'Unable to delete task.',
  },
  rowActions: {
    edit: 'Edit task',
    delete: 'Delete task',
  },
  placeholder: '—',
  success: {
    created: (name) => `"${name}" created.`,
    updated: (name) => `"${name}" updated.`,
    deleted: (name) => `"${name}" deleted.`,
  },
  gantt: {
    today: 'Today',
    prev: '← Prev',
    next: 'Next →',
    viewDay: '14 Days',
    viewWeek: '28 Days',
    viewMonth: '84 Days',
    noTasks: 'No tasks to display.',
    taskName: 'Task',
  },
  views: {
    gantt: 'Gantt',
    grid: 'Grid',
  },
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-slate-100 text-slate-600',
    barClass: 'bg-slate-400',
    barFillClass: 'bg-slate-300',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    barClass: 'bg-indigo-500',
    barFillClass: 'bg-indigo-300',
  },
  done: {
    label: 'Done',
    badgeClass: 'bg-green-100 text-green-700',
    barClass: 'bg-green-500',
    barFillClass: 'bg-green-300',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-700',
    barClass: 'bg-rose-400',
    barFillClass: 'bg-rose-200',
  },
};

export const DEFAULT_STATUS = 'pending';

export function getApiErrorMessage(error, fallbackMessage) {
  const message = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallbackMessage;
}
