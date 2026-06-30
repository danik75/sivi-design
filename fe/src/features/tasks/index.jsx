import PropTypes from 'prop-types';
import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import TaskDeleteDialog from '@/features/tasks/components/TaskDeleteDialog';
import TaskModal from '@/features/tasks/components/TaskModal';
import TasksGantt from '@/features/tasks/components/TasksGantt';
import TasksGrid from '@/features/tasks/components/TasksGrid';
import { TASK_TEXT } from '@/features/tasks/constants';

const STORAGE_KEY = 'sivi_tasks_view';

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
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {['gantt', 'grid'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onView(v)}
          className={`px-4 py-2 text-sm font-semibold transition-colors capitalize ${
            view === v
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
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

export default function TasksFeature() {
  const { showToast } = useToast();
  const [view, setView] = useState(loadView);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

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
    setDeleteTask(null);
  };

  return (
    <>
      {/* View switcher — floated top-right via absolute overlay */}
      <div className="relative">
        <div className="absolute right-0 top-0 z-10">
          <ViewSwitcher view={view} onView={handleViewChange} />
        </div>

        {view === 'gantt' ? (
          <TasksGantt
            onCreate={() => setShowCreate(true)}
            onEdit={(task) => setEditTask(task)}
          />
        ) : (
          <TasksGrid
            onCreate={() => setShowCreate(true)}
            onEdit={(task) => setEditTask(task)}
            onDelete={(task) => setDeleteTask(task)}
          />
        )}
      </div>

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
      />

      <TaskDeleteDialog
        isOpen={Boolean(deleteTask)}
        onClose={() => setDeleteTask(null)}
        task={deleteTask}
        onSuccess={handleSuccess}
      />
    </>
  );
}
