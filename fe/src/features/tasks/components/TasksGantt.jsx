import PropTypes from 'prop-types';
import { useState } from 'react';
import Button from '@/components/chadcn/Button';
import { STATUS_CONFIG, TASK_TEXT } from '@/features/tasks/constants';
import useTasks from '@/features/tasks/hooks/useTasks';
import useUpdateTask from '@/features/tasks/hooks/useUpdateTask';

// ---------------------------------------------------------------------------
// Date helpers — pure functions, no external libraries
// ---------------------------------------------------------------------------
const MS = 86400000;
function parseDate(str) { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(date, n) { return new Date(date.getTime() + n * MS); }
function diffDays(a, b) { return Math.round((b.getTime() - a.getTime()) / MS); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtMonth(d) { return d.toLocaleDateString('en-US', { month: 'short' }); }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VIEW_RANGES = { day: 14, week: 28, month: 84 };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ViewToggle({ view, onView }) {
  const opts = [
    { key: 'day', label: TASK_TEXT.gantt.viewDay },
    { key: 'week', label: TASK_TEXT.gantt.viewWeek },
    { key: 'month', label: TASK_TEXT.gantt.viewMonth },
  ];
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {opts.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onView(key)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === key
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

ViewToggle.propTypes = {
  view: PropTypes.oneOf(['day', 'week', 'month']).isRequired,
  onView: PropTypes.func.isRequired,
};

function GanttBar({ task, rangeStart, totalDays, rangeEnd, onEdit, onDragEnd }) {
  const [dragDelta, setDragDelta] = useState(0);
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const taskStart = parseDate(task.startDate);
  const taskEnd = parseDate(task.endDate);

  // Compute after hooks so hooks are never skipped
  const isOutsideRange = taskEnd < rangeStart || taskStart > rangeEnd;

  const clampedStart = taskStart < rangeStart ? rangeStart : taskStart;
  const clampedEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

  const leftDays = diffDays(rangeStart, clampedStart);
  const spanDays = diffDays(clampedStart, clampedEnd) + 1;

  const effectiveLeftDays = leftDays + dragDelta;
  const effectiveLeftPct = Math.max(0, (effectiveLeftDays / totalDays) * 100);
  const widthPct = (spanDays / totalDays) * 100;
  const fillPct = Math.min(100, Math.max(0, task.percentComplete ?? 0));

  const barBg = task.color ?? null;

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = e.currentTarget.closest('[data-gantt-timeline]');
    if (!container) return;
    const { width: containerWidth } = container.getBoundingClientRect();
    const pxPerDay = containerWidth / totalDays;
    const startX = e.clientX;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const days = Math.round(deltaX / pxPerDay);
      setDragDelta(days);
    };

    const onMouseUp = (upEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const finalDays = Math.round((upEvent.clientX - startX) / pxPerDay);
      setDragDelta(0);
      if (Math.abs(upEvent.clientX - startX) < 4) {
        onEdit(task);
      } else if (finalDays !== 0) {
        onDragEnd(task, finalDays);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (isOutsideRange) return null;

  return (
    <div
      className={`absolute top-1.5 bottom-1.5 rounded select-none overflow-hidden shadow-sm${barBg === null ? ` ${config.barClass}` : ''}${dragDelta !== 0 ? ' opacity-80' : ''}`}
      style={{
        left: `${effectiveLeftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: barBg ?? undefined,
        cursor: dragDelta !== 0 ? 'grabbing' : 'pointer',
      }}
      onMouseDown={handleMouseDown}
      title={`${task.name} — ${fillPct}% complete`}
    >
      {/* percent-complete fill */}
      {barBg !== null ? (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${fillPct}%`, backgroundColor: barBg, opacity: 0.5 }}
        />
      ) : (
        <div
          className={`absolute inset-y-0 left-0 ${config.barFillClass}`}
          style={{ width: `${fillPct}%` }}
        />
      )}
      {/* label */}
      <span className="relative z-10 px-1.5 text-xs font-medium text-white leading-none truncate flex items-center h-full">
        {task.name}
      </span>
    </div>
  );
}

GanttBar.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string,
    percentComplete: PropTypes.number,
    color: PropTypes.string,
  }).isRequired,
  rangeStart: PropTypes.instanceOf(Date).isRequired,
  rangeEnd: PropTypes.instanceOf(Date).isRequired,
  totalDays: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TasksGantt({ onCreate, onEdit, visibleStatuses }) {
  const [view, setView] = useState('week');
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()));

  const totalDays = VIEW_RANGES[view];
  const rangeEnd = addDays(rangeStart, totalDays - 1);

  const { data, isLoading } = useTasks({ limit: 500 });
  const allTasks = data?.data ?? [];
  const tasks = visibleStatuses
    ? allTasks.filter((t) => visibleStatuses.has(t.status))
    : allTasks;

  const updateMutation = useUpdateTask();

  const handleDragEnd = (task, days) => {
    const addDaysToStr = (dateStr, n) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d + n);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };
    updateMutation.mutate({
      id: task.id,
      data: {
        startDate: addDaysToStr(task.startDate, days),
        endDate: addDaysToStr(task.endDate, days),
      },
    });
  };

  // Build day columns
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));

  // Navigation handlers
  const goToday = () => setRangeStart(startOfDay(new Date()));
  const goPrev = () => setRangeStart((d) => addDays(d, -Math.floor(totalDays / 2)));
  const goNext = () => setRangeStart((d) => addDays(d, Math.floor(totalDays / 2)));

  const handleViewChange = (nextView) => {
    setView(nextView);
    // Re-center on today when switching views
    setRangeStart(startOfDay(new Date()));
  };

  // Column header label
  const colLabel = (day, index) => {
    if (view === 'month') {
      // Show month name only on the 1st of the month, else show day number
      return day.getDate() === 1 ? fmtMonth(day) : String(day.getDate());
    }
    // day / week modes: abbreviated date
    return index === 0 || day.getDate() === 1 ? fmtShort(day) : String(day.getDate());
  };

  const todayStr = startOfDay(new Date()).getTime();

  // Separate tasks that are entirely outside the range (to show count)
  const visibleTasks = tasks.filter((t) => {
    if (!t.startDate || !t.endDate) return false;
    const ts = parseDate(t.startDate);
    const te = parseDate(t.endDate);
    return !(te < rangeStart || ts > rangeEnd);
  });

  return (
    <section className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{TASK_TEXT.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{TASK_TEXT.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCreate} className="shrink-0">
            {TASK_TEXT.addTask}
          </Button>
        </div>
      </div>

      {/* Gantt controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={goPrev} className="px-3 py-1.5 text-xs">
            {TASK_TEXT.gantt.prev}
          </Button>
          <Button type="button" variant="ghost" onClick={goToday} className="px-3 py-1.5 text-xs">
            {TASK_TEXT.gantt.today}
          </Button>
          <Button type="button" variant="ghost" onClick={goNext} className="px-3 py-1.5 text-xs">
            {TASK_TEXT.gantt.next}
          </Button>
          <span className="text-xs text-slate-400">
            {fmtShort(rangeStart)} – {fmtShort(rangeEnd)}
          </span>
        </div>
        <ViewToggle view={view} onView={handleViewChange} />
      </div>

      {/* Gantt body */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">{TASK_TEXT.loading}</div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {TASK_TEXT.gantt.noTasks}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(600, totalDays * 32)}px` }}>
              {/* Column headers */}
              <div className="flex border-b border-slate-100">
                {/* Task name column header */}
                <div className="w-44 shrink-0 border-r border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {TASK_TEXT.gantt.taskName}
                </div>
                {/* Day columns */}
                <div className="flex flex-1">
                  {days.map((day, i) => {
                    const isToday = day.getTime() === todayStr;
                    return (
                      <div
                        key={i}
                        className={`flex-1 border-r border-slate-50 py-2 text-center text-xs ${
                          isToday
                            ? 'bg-indigo-50 font-bold text-indigo-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {colLabel(day, i)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task rows */}
              {tasks.map((task) => {
                if (!task.startDate || !task.endDate) return null;
                const ts = parseDate(task.startDate);
                const te = parseDate(task.endDate);
                const outsideRange = te < rangeStart || ts > rangeEnd;

                return (
                  <div
                    key={task.id}
                    className={`flex border-b border-slate-50 last:border-b-0 hover:bg-slate-50/40 transition-colors ${
                      outsideRange ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Task name */}
                    <div
                      className="w-44 shrink-0 border-r border-slate-100 px-3 py-0 flex items-center cursor-pointer"
                      onClick={() => onEdit(task)}
                    >
                      <div className="py-2">
                        <p className="text-xs font-medium text-slate-800 truncate max-w-[160px]">
                          {task.name}
                        </p>
                        {task.customerName ? (
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">
                            {task.customerName}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Timeline area */}
                    <div className="relative flex-1" data-gantt-timeline style={{ height: '48px' }}>
                      {/* Today highlight column */}
                      {days.map((day, i) => {
                        if (day.getTime() !== todayStr) return null;
                        const leftPct = (i / totalDays) * 100;
                        const widthPct = (1 / totalDays) * 100;
                        return (
                          <div
                            key="today-col"
                            className="absolute inset-y-0 bg-indigo-50/60"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          />
                        );
                      })}

                      {/* Vertical grid lines */}
                      {days.map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 border-r border-slate-50"
                          style={{ left: `${((i + 1) / totalDays) * 100}%` }}
                        />
                      ))}

                      {/* Task bar */}
                      <GanttBar
                        task={task}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        totalDays={totalDays}
                        onEdit={onEdit}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {tasks.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 px-1">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cfg.barClass}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          ))}
          {visibleTasks.length < tasks.length ? (
            <span className="text-xs text-slate-400">
              ({tasks.length - visibleTasks.length} task{tasks.length - visibleTasks.length !== 1 ? 's' : ''} outside range)
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

TasksGantt.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  visibleStatuses: PropTypes.instanceOf(Set),
};
