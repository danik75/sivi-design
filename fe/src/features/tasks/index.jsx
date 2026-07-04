import PropTypes from 'prop-types';
import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import TaskModal from '@/features/tasks/components/TaskModal';
import TaskCompleteDialog from '@/features/tasks/components/TaskCompleteDialog';
import TasksGantt from '@/features/tasks/components/TasksGantt';
import TasksGrid from '@/features/tasks/components/TasksGrid';
import { STATUS_CONFIG, STATUS_OPTIONS, TASK_TEXT } from '@/features/tasks/constants';

const STORAGE_KEY = 'sivi_tasks_view';
const ALL_STATUSES = STATUS_OPTIONS.map((o) => o.value);

function loadView() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'grid' || stored === 'gantt') return stored;
  } catch (_) {
    // ignore
  }
  return 'gantt';
}

function ViewSwitcher({ view, onView }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200">
      {['gantt', 'grid'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onView(v)}
          className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
            view === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {TASK_TEXT.views[v]}
        </button>
      ))}
    </div>
  );
}

ViewSwitcher.propTypes = {
  view: PropTypes.oneOf(['gantt', 'grid']).isRequired,
  onView: PropTypes.func.isRequired,
};

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <div className="relative h-4 w-4 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div
        className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
          checked || indeterminate ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
        }`}
      >
        {indeterminate && !checked ? (
          <span className="block h-0.5 w-2 bg-white rounded" />
        ) : checked ? (
          <svg
            className="h-2.5 w-2.5 text-white"
            viewBox="0 0 12 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1,5 4,9 11,1" />
          </svg>
        ) : null}
      </div>
    </div>
  );
}

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  indeterminate: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

function StatusFilterBar({ visibleStatuses, onToggle, onToggleAll }) {
  const allChecked = ALL_STATUSES.every((s) => visibleStatuses.has(s));
  const someChecked = ALL_STATUSES.some((s) => visibleStatuses.has(s));

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <label className="flex cursor-pointer select-none items-center gap-1.5">
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onChange={onToggleAll}
        />
        <span className="text-xs font-semibold text-slate-700">All</span>
      </label>
      <span className="select-none text-slate-200">|</span>
      {STATUS_OPTIONS.map(({ value, label }) => (
        <label key={value} className="flex cursor-pointer select-none items-center gap-1.5">
          <Checkbox checked={visibleStatuses.has(value)} onChange={() => onToggle(value)} />
          <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[value].barClass}`} />
          <span className="text-xs text-slate-600">{label}</span>
        </label>
      ))}
    </div>
  );
}

StatusFilterBar.propTypes = {
  visibleStatuses: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  onToggleAll: PropTypes.func.isRequired,
};

export default function TasksFeature() {
  const { showToast } = useToast();
  const [view, setView] = useState(loadView);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null); // { task, extra? }
  const [visibleStatuses, setVisibleStatuses] = useState(() => new Set(['pending', 'in_progress']));

  const handleViewChange = (nextView) => {
    setView(nextView);
    try {
      localStorage.setItem(STORAGE_KEY, nextView);
    } catch (_) {
      // ignore
    }
  };

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setEditTask(null);
  };

  const toggleStatus = (status) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setVisibleStatuses((prev) => {
      const allChecked = ALL_STATUSES.every((s) => prev.has(s));
      return allChecked ? new Set() : new Set(ALL_STATUSES);
    });
  };

  return (
    <>
      {/* Filter + view switcher bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
        <StatusFilterBar
          visibleStatuses={visibleStatuses}
          onToggle={toggleStatus}
          onToggleAll={toggleAll}
        />
        <ViewSwitcher view={view} onView={handleViewChange} />
      </div>

      {view === 'gantt' ? (
        <TasksGantt
          onCreate={() => setShowCreate(true)}
          onEdit={(task) => setEditTask(task)}
          onComplete={(task) => setCompleteTarget({ task })}
          visibleStatuses={visibleStatuses}
        />
      ) : (
        <TasksGrid
          onCreate={() => setShowCreate(true)}
          onEdit={(task) => setEditTask(task)}
          onComplete={(task) => setCompleteTarget({ task })}
          visibleStatuses={visibleStatuses}
        />
      )}

      <TaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        task={null}
        onSuccess={handleSuccess}
      />

      <TaskModal
        isOpen={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        onSuccess={handleSuccess}
        onComplete={(task, extra) => {
          setEditTask(null);
          setCompleteTarget({ task, extra });
        }}
      />

      <TaskCompleteDialog
        isOpen={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        task={completeTarget?.task}
        extraData={completeTarget?.extra}
        onSuccess={handleSuccess}
      />
    </>
  );
}
