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
function parseDate(str) {
  if (str.includes('T')) {
    const dt = new Date(str);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(date, n) {
  return new Date(date.getTime() + n * MS);
}
function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS);
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtMonth(d) {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VIEW_RANGES = { hour: 1, day: 14, week: 28, month: 84 };

// Intra-day (hourly) view: visible window and helpers
const HOUR_VIEW = { startHour: 7, endHour: 21 };

function parseTimeToHour(t) {
  if (!t || typeof t !== 'string') return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h + (Number.isNaN(m) ? 0 : m) / 60;
}
function fmtHourLabel(h) {
  return `${String(h).padStart(2, '0')}:00`;
}
function fmtHours(n) {
  const s = Number(n).toFixed(2);
  return s.replace(/\.?0+$/, '');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ViewToggle({ view, onView }) {
  const opts = [
    { key: 'hour', label: TASK_TEXT.gantt.viewHour },
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
            view === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

ViewToggle.propTypes = {
  view: PropTypes.oneOf(['hour', 'day', 'week', 'month']).isRequired,
  onView: PropTypes.func.isRequired,
};

function useDrag(totalDays, onEnd) {
  const [delta, setDelta] = useState(0);
  const [active, setActive] = useState(false);

  function start(e) {
    e.preventDefault();
    e.stopPropagation();

    // Walk up from the mousedown target to find the timeline container
    let container = e.currentTarget;
    while (container && !container.dataset.ganttTimeline) {
      container = container.parentElement;
    }
    if (!container) return;

    const { width: containerWidth } = container.getBoundingClientRect();
    const pxPerDay = containerWidth / totalDays;
    const startX = e.clientX;

    const onMove = (mv) => {
      mv.preventDefault();
      setActive(true);
      setDelta(Math.round((mv.clientX - startX) / pxPerDay));
    };

    const onUp = (up) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const finalDays = Math.round((up.clientX - startX) / pxPerDay);
      setDelta(0);
      setActive(false);
      onEnd(finalDays, Math.abs(up.clientX - startX) < 4);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return { delta, active, start };
}

// Drag hook for the hourly view — reports the delta in hours, snapped to 30 min.
function useHourDrag(winLen, onEnd) {
  const [delta, setDelta] = useState(0);
  const [active, setActive] = useState(false);

  function start(e) {
    e.preventDefault();
    e.stopPropagation();
    let container = e.currentTarget;
    while (container && !container.dataset.ganttTimeline) {
      container = container.parentElement;
    }
    if (!container) return;

    const { width } = container.getBoundingClientRect();
    const pxPerHour = width / winLen;
    const startX = e.clientX;
    const snap = (px) => Math.round((px / pxPerHour) * 2) / 2; // 0.5h steps

    const onMove = (mv) => {
      mv.preventDefault();
      setActive(true);
      setDelta(snap(mv.clientX - startX));
    };
    const onUp = (up) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const finalHours = snap(up.clientX - startX);
      setDelta(0);
      setActive(false);
      onEnd(finalHours, Math.abs(up.clientX - startX) < 4);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return { delta, active, start };
}

function GanttBar({ task, rangeStart, totalDays, rangeEnd, onEdit, onDragEnd }) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const taskStart = parseDate(task.startDate);
  const taskEnd = parseDate(task.endDate);
  const isOutsideRange = taskEnd < rangeStart || taskStart > rangeEnd;

  const clampedStart = taskStart < rangeStart ? rangeStart : taskStart;
  const clampedEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;
  const leftDays = diffDays(rangeStart, clampedStart);
  const spanDays = diffDays(clampedStart, clampedEnd) + 1;

  const moveDrag = useDrag(totalDays, (days, wasClick) => {
    if (wasClick) onEdit(task);
    else if (days !== 0) onDragEnd(task, { type: 'move', days });
  });
  const leftDrag = useDrag(totalDays, (days) => {
    if (days !== 0) onDragEnd(task, { type: 'resize-start', days });
  });
  const rightDrag = useDrag(totalDays, (days) => {
    if (days !== 0) onDragEnd(task, { type: 'resize-end', days });
  });

  const isDragging = moveDrag.active || leftDrag.active || rightDrag.active;

  const effectiveLeft = Math.max(0, leftDays + moveDrag.delta + leftDrag.delta);
  const effectiveSpan = Math.max(1, spanDays - leftDrag.delta + rightDrag.delta);
  const leftPct = (effectiveLeft / totalDays) * 100;
  const widthPct = (effectiveSpan / totalDays) * 100;
  const fillPct = Math.min(100, Math.max(0, task.percentComplete ?? 0));
  const barBg = task.color ?? null;

  if (isOutsideRange) return null;

  return (
    <div
      className={`absolute top-1.5 bottom-1.5 rounded select-none overflow-hidden shadow-sm${barBg === null ? ` ${config.barClass}` : ''}${isDragging ? ' opacity-75 shadow-lg' : ''}`}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: barBg ?? undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onMouseDown={moveDrag.start}
      title={`${task.name} — ${fillPct}% complete${
        task.estimatedHours != null ? ` · est ${fmtHours(task.estimatedHours)}h` : ''
      }${task.actualHours != null ? ` · actual ${fmtHours(task.actualHours)}h` : ''}`}
    >
      {/* percent-complete fill */}
      {barBg !== null ? (
        <div className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${fillPct}%` }} />
      ) : (
        <div
          className={`absolute inset-y-0 left-0 ${config.barFillClass}`}
          style={{ width: `${fillPct}%` }}
        />
      )}
      {/* status dot — only when a custom color is set */}
      {barBg !== null && (
        <span
          className={`absolute left-3 top-1/2 z-10 h-2.5 w-2.5 shrink-0 -translate-y-1/2 rounded-full ring-1 ring-white/60 ${config.barClass}`}
        />
      )}
      {/* label */}
      <span
        className={`relative z-10 text-xs font-medium text-white leading-none truncate flex items-center h-full ${barBg !== null ? 'pl-7 pr-4' : 'px-4'}`}
      >
        {task.name}
      </span>
      {/* Left resize handle */}
      <div
        className="absolute inset-y-0 left-0 w-2 cursor-ew-resize z-20 hover:bg-black/10"
        style={{ touchAction: 'none' }}
        onMouseDown={(e) => {
          e.stopPropagation();
          leftDrag.start(e);
        }}
      />
      {/* Right resize handle */}
      <div
        className="absolute inset-y-0 right-0 w-2 cursor-ew-resize z-20 hover:bg-black/10"
        style={{ touchAction: 'none' }}
        onMouseDown={(e) => {
          e.stopPropagation();
          rightDrag.start(e);
        }}
      />
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
// Hourly (intra-day) view
// ---------------------------------------------------------------------------

function HourlyBar({ task, day, onEdit, onTimeChange }) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const { startHour: winStart, endHour: winEnd } = HOUR_VIEW;
  const winLen = winEnd - winStart;

  const startsToday = parseDate(task.startDate).getTime() === day.getTime();
  const endsToday = parseDate(task.endDate).getTime() === day.getTime();
  const sTime = parseTimeToHour(task.startTime);
  const eTime = parseTimeToHour(task.endTime);
  const est = task.estimatedHours != null ? Number(task.estimatedHours) : null;

  let barStart;
  let barEnd;
  let estimated = false;
  let untimed = false;

  if (sTime != null || eTime != null) {
    barStart = startsToday && sTime != null ? sTime : winStart;
    barEnd = endsToday && eTime != null ? eTime : winEnd;
  } else if (est != null && est > 0) {
    barStart = winStart;
    barEnd = barStart + est;
    estimated = true;
  } else {
    barStart = winStart;
    barEnd = winEnd;
    untimed = true;
  }

  barStart = Math.max(winStart, Math.min(barStart, winEnd));
  barEnd = Math.max(barStart, Math.min(barEnd, winEnd));

  // Only single-day tasks can be dragged/resized within the day.
  const draggable = startsToday && endsToday && Boolean(onTimeChange);

  const moveDrag = useHourDrag(winLen, (h, wasClick) => {
    if (wasClick) onEdit(task);
    else if (h !== 0) onTimeChange(task, { type: 'move', hours: h });
  });
  const leftDrag = useHourDrag(winLen, (h) => {
    if (h !== 0) onTimeChange(task, { type: 'resize-start', hours: h });
  });
  const rightDrag = useHourDrag(winLen, (h) => {
    if (h !== 0) onTimeChange(task, { type: 'resize-end', hours: h });
  });
  const dragging = moveDrag.active || leftDrag.active || rightDrag.active;

  // Live preview while dragging
  let previewStart = barStart + moveDrag.delta + leftDrag.delta;
  let previewEnd = barEnd + moveDrag.delta + rightDrag.delta;
  previewStart = Math.max(winStart, Math.min(previewStart, winEnd - 0.5));
  previewEnd = Math.max(previewStart + 0.5, Math.min(previewEnd, winEnd));

  const leftPct = ((previewStart - winStart) / winLen) * 100;
  let widthPct = Math.max(((previewEnd - previewStart) / winLen) * 100, 4);
  if (leftPct + widthPct > 100) widthPct = 100 - leftPct;

  const fillPct = Math.min(100, Math.max(0, task.percentComplete ?? 0));
  const barBg = task.color ?? null;

  const timeStr = task.startTime
    ? ` — ${task.startTime}${task.endTime ? `–${task.endTime}` : ''}`
    : '';
  const estStr = est != null ? ` · est ${fmtHours(est)}h` : '';
  const actStr = task.actualHours != null ? ` · actual ${fmtHours(task.actualHours)}h` : '';
  const tooltip = `${task.name}${timeStr}${estStr}${actStr}`;

  return (
    <div
      className={`absolute top-1.5 bottom-1.5 rounded overflow-hidden shadow-sm select-none${
        barBg === null ? ` ${config.barClass}` : ''
      }${estimated ? ' opacity-80' : ''}${untimed ? ' opacity-50' : ''}${dragging ? ' opacity-75 shadow-lg' : ''}`}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: barBg ?? undefined,
        border: estimated ? '1px dashed rgba(255,255,255,0.8)' : undefined,
        cursor: draggable ? (dragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: 'none',
      }}
      onMouseDown={draggable ? moveDrag.start : undefined}
      onClick={draggable ? undefined : () => onEdit(task)}
      title={tooltip}
    >
      {barBg !== null ? (
        <div className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${fillPct}%` }} />
      ) : (
        <div
          className={`absolute inset-y-0 left-0 ${config.barFillClass}`}
          style={{ width: `${fillPct}%` }}
        />
      )}
      <span className="relative z-10 flex h-full items-center truncate px-2 text-xs font-medium leading-none text-white">
        {task.name}
        {estimated ? ` (${TASK_TEXT.gantt.estimatedTag})` : ''}
      </span>
      {!startsToday ? (
        <span className="absolute inset-y-0 left-0.5 z-10 flex items-center text-[11px] text-white/80">‹</span>
      ) : null}
      {!endsToday ? (
        <span className="absolute inset-y-0 right-0.5 z-10 flex items-center text-[11px] text-white/80">›</span>
      ) : null}
      {draggable ? (
        <>
          <div
            className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize hover:bg-black/10"
            style={{ touchAction: 'none' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              leftDrag.start(e);
            }}
          />
          <div
            className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize hover:bg-black/10"
            style={{ touchAction: 'none' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              rightDrag.start(e);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

HourlyBar.propTypes = {
  task: PropTypes.object.isRequired,
  day: PropTypes.instanceOf(Date).isRequired,
  onEdit: PropTypes.func.isRequired,
  onTimeChange: PropTypes.func,
};

function HourlyBody({ tasks, day, onEdit, onComplete, onTimeChange }) {
  const { startHour, endHour } = HOUR_VIEW;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dayMs = day.getTime();

  const dayTasks = tasks.filter((t) => {
    if (!t.startDate || !t.endDate) return false;
    return parseDate(t.startDate).getTime() <= dayMs && parseDate(t.endDate).getTime() >= dayMs;
  });

  if (dayTasks.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-slate-500">{TASK_TEXT.gantt.noTasks}</div>
    );
  }

  return (
    <div className="overflow-auto" style={{ maxHeight: '560px' }}>
      <div style={{ minWidth: `${Math.max(600, hours.length * 60)}px` }}>
        {/* Column headers */}
        <div className="sticky top-0 z-10 flex border-b border-slate-100 bg-white">
          <div className="w-44 shrink-0 border-r border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {TASK_TEXT.gantt.taskName}
          </div>
          <div className="flex flex-1">
            {hours.map((h) => (
              <div
                key={h}
                className="flex-1 border-r border-slate-50 py-2 text-center text-xs text-slate-400"
              >
                {fmtHourLabel(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {dayTasks.map((task) => {
          const canComplete = task.status !== 'done' && task.status !== 'cancelled';
          return (
            <div
              key={task.id}
              className="flex border-b border-slate-50 transition-colors last:border-b-0 hover:bg-slate-50/40"
            >
              <div className="flex w-44 shrink-0 items-center justify-between gap-1 border-r border-slate-100 px-3">
                <div className="min-w-0 cursor-pointer py-2" onClick={() => onEdit(task)}>
                  <p className="max-w-[130px] truncate text-xs font-medium text-slate-800">
                    {task.name}
                  </p>
                  {task.customerName ? (
                    <p className="max-w-[130px] truncate text-xs text-slate-400">
                      {task.customerName}
                    </p>
                  ) : null}
                </div>
                {canComplete ? (
                  <button
                    type="button"
                    onClick={() => onComplete(task)}
                    title="Mark done"
                    aria-label="Mark task done"
                    className="shrink-0 text-sm font-bold text-green-600 hover:text-green-700"
                  >
                    ✓
                  </button>
                ) : null}
              </div>

              <div className="relative flex-1" data-gantt-timeline="1" style={{ height: '48px' }}>
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute inset-y-0 border-r border-slate-50"
                    style={{ left: `${((i + 1) / hours.length) * 100}%` }}
                  />
                ))}
                <HourlyBar task={task} day={day} onEdit={onEdit} onTimeChange={onTimeChange} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

HourlyBody.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  day: PropTypes.instanceOf(Date).isRequired,
  onEdit: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onTimeChange: PropTypes.func,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TasksGantt({ onCreate, onEdit, onComplete, visibleStatuses }) {
  const [view, setView] = useState('week');
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()));

  const isHourly = view === 'hour';
  const totalDays = VIEW_RANGES[view];
  const rangeEnd = addDays(rangeStart, totalDays - 1);

  const { data, isLoading } = useTasks({ limit: 500 });
  const allTasks = data?.data ?? [];
  const tasks = visibleStatuses ? allTasks.filter((t) => visibleStatuses.has(t.status)) : allTasks;

  const updateMutation = useUpdateTask();

  const handleDragEnd = (task, action) => {
    const shift = (dateStr, n) => {
      const base = parseDate(dateStr);
      const [y, m, d] = [base.getFullYear(), base.getMonth() + 1, base.getDate()];
      const dt = new Date(y, m - 1, d + n);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };
    let updates = {};
    if (action.type === 'move') {
      updates = {
        startDate: shift(task.startDate, action.days),
        endDate: shift(task.endDate, action.days),
      };
    } else if (action.type === 'resize-start') {
      const newStart = shift(task.startDate, action.days);
      if (newStart <= task.endDate) updates = { startDate: newStart };
    } else if (action.type === 'resize-end') {
      const newEnd = shift(task.endDate, action.days);
      if (newEnd >= task.startDate) updates = { endDate: newEnd };
    }
    if (Object.keys(updates).length) {
      updateMutation.mutate({ id: task.id, data: updates });
    }
  };

  // Hourly view: move/resize a task by adjusting its start/end time.
  const handleHourChange = (task, action) => {
    const { startHour, endHour } = HOUR_VIEW;
    const dur = task.estimatedHours ? Number(task.estimatedHours) : 1;
    let s = parseTimeToHour(task.startTime);
    let e = parseTimeToHour(task.endTime);
    if (s == null) s = startHour;
    if (e == null) e = Math.min(endHour, s + dur);

    if (action.type === 'move') {
      const span = Math.max(0.5, e - s);
      s = Math.max(0, Math.min(s + action.hours, 24 - span));
      e = s + span;
    } else if (action.type === 'resize-start') {
      s = Math.max(0, Math.min(s + action.hours, e - 0.5));
    } else if (action.type === 'resize-end') {
      e = Math.min(24, Math.max(e + action.hours, s + 0.5));
    }

    const fmt = (h) => {
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };
    updateMutation.mutate({ id: task.id, data: { startTime: fmt(s), endTime: fmt(e) } });
  };

  // Build day columns
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));

  // Navigation handlers — hourly view steps a single day at a time
  const navStep = isHourly ? 1 : Math.floor(totalDays / 2);
  const goToday = () => setRangeStart(startOfDay(new Date()));
  const goPrev = () => setRangeStart((d) => addDays(d, -navStep));
  const goNext = () => setRangeStart((d) => addDays(d, navStep));

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
            {isHourly
              ? rangeStart.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : `${fmtShort(rangeStart)} – ${fmtShort(rangeEnd)}`}
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
        ) : isHourly ? (
          <HourlyBody
            tasks={tasks}
            day={rangeStart}
            onEdit={onEdit}
            onComplete={onComplete}
            onTimeChange={handleHourChange}
          />
        ) : (
          <div className="overflow-auto" style={{ maxHeight: '560px' }}>
            <div style={{ minWidth: `${Math.max(600, totalDays * 32)}px` }}>
              {/* Column headers */}
              <div className="flex border-b border-slate-100 sticky top-0 z-10 bg-white">
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
                          isToday ? 'bg-indigo-50 font-bold text-indigo-600' : 'text-slate-400'
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
                    <div
                      className="relative flex-1"
                      data-gantt-timeline="1"
                      style={{ height: '48px' }}
                    >
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
              ({tasks.length - visibleTasks.length} task
              {tasks.length - visibleTasks.length !== 1 ? 's' : ''} outside range)
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
  onComplete: PropTypes.func.isRequired,
  visibleStatuses: PropTypes.instanceOf(Set),
};
