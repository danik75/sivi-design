import { Cell, Pie, PieChart } from 'recharts';
import useInvoices from '@/features/invoices/hooks/useInvoices';
import { useRevenueBreakdown } from '@/features/reports/hooks';
import useBusinessProposals from '@/features/business-proposals/hooks/useBusinessProposals';
import useBusinessTargets from '@/features/business-targets/hooks/useBusinessTargets';
import { STATUS_CONFIG } from '@/features/tasks/constants';
import useTasks from '@/features/tasks/hooks/useTasks';

const MONTH_LABEL = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const HOME_TEXT = {
  title: 'Home Dashboard',
  subtitle: 'Overview of tasks, receivables, project health, and current month performance.',
  ganttTitle: 'Top 5 Relevant Tasks (Gantt)',
  unpaidTitle: 'Sent but Unpaid Invoices',
  pendingProposalsTitle: 'Pending Business Proposals',
  projectTitle: 'Project Status',
  financeTitle: 'Current Month Billing',
  incomeTitle: 'Income Distribution',
  taskEmpty: 'No relevant tasks to show.',
  unpaidEmpty: 'No sent invoices waiting for payment.',
  pendingProposalsEmpty: 'No pending proposals.',
  projectEmpty: 'No project status data available.',
  financeEmpty: 'No billing data available for this month.',
  incomeEmpty: 'No income distribution data available.',
  labels: {
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    cancelled: 'Cancelled',
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    queued: 'Queued',
    inProgress: 'In Progress',
    pendingDecision: 'Pending Decision',
  },
};

const now = new Date();
const CURRENT_MONTH_FILTER = {
  period: 'monthly',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
};

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.includes('T')) {
    const d = new Date(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtDate = (value) => {
  const d = parseDate(value);
  return d ? d.toLocaleDateString() : '—';
};

const fmtMoney = (value, currency = '') =>
  `${parseFloat(value || 0).toFixed(2)} ${currency}`.trim();

const GANTT_DAYS = 28;
const MS = 86400000;
function addDays(d, n) { return new Date(d.getTime() + n * MS); }
function diffDays(a, b) { return Math.round((b.getTime() - a.getTime()) / MS); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function HomeGantt({ tasks }) {
  if (!tasks.length) {
    return <p className="px-5 pb-4 text-sm text-slate-400">{HOME_TEXT.taskEmpty}</p>;
  }

  const today = startOfDay(new Date());
  const rangeStart = today;
  const rangeEnd = addDays(today, GANTT_DAYS - 1);
  const totalDays = GANTT_DAYS;
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  const todayMs = today.getTime();

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${Math.max(500, totalDays * 28)}px` }}>
        {/* Column headers */}
        <div className="flex border-b border-slate-100">
          <div className="w-36 shrink-0 border-r border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Task
          </div>
          <div className="flex flex-1">
            {days.map((day, i) => {
              const isToday = day.getTime() === todayMs;
              const label = i === 0 || day.getDate() === 1 ? fmtShort(day) : String(day.getDate());
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-slate-50 py-2 text-center text-xs ${
                    isToday ? 'bg-indigo-50 font-bold text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task rows */}
        {tasks.map((task) => {
          if (!task.startDate || !task.endDate) return null;
          const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
          const ts = parseDate(task.startDate);
          const te = parseDate(task.endDate);
          const clampedStart = ts < rangeStart ? rangeStart : ts;
          const clampedEnd = te > rangeEnd ? rangeEnd : te;
          const leftDays = diffDays(rangeStart, clampedStart);
          const spanDays = diffDays(clampedStart, clampedEnd) + 1;
          const leftPct = (leftDays / totalDays) * 100;
          const widthPct = (spanDays / totalDays) * 100;
          const fillPct = Math.min(100, Math.max(0, task.percentComplete ?? 0));
          const outsideRange = te < rangeStart || ts > rangeEnd;

          return (
            <div
              key={task.id}
              className={`flex border-b border-slate-50 last:border-b-0 hover:bg-slate-50/40 transition-colors${outsideRange ? ' opacity-40' : ''}`}
            >
              <div className="w-36 shrink-0 border-r border-slate-100 px-3 py-1 flex items-center">
                <div>
                  <p className="text-xs font-medium text-slate-800 truncate max-w-[128px]">{task.name}</p>
                  {task.customerName && (
                    <p className="text-xs text-slate-400 truncate max-w-[128px]">{task.customerName}</p>
                  )}
                </div>
              </div>
              <div className="relative flex-1" style={{ height: '44px' }}>
                {/* today column highlight */}
                {days.map((day, i) => {
                  if (day.getTime() !== todayMs) return null;
                  return (
                    <div
                      key="today"
                      className="absolute inset-y-0 bg-indigo-50/60"
                      style={{ left: `${(i / totalDays) * 100}%`, width: `${(1 / totalDays) * 100}%` }}
                    />
                  );
                })}
                {/* grid lines */}
                {days.map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 border-r border-slate-50"
                    style={{ left: `${((i + 1) / totalDays) * 100}%` }}
                  />
                ))}
                {/* bar */}
                {!outsideRange && (() => {
                  const barBg = task.color ?? null;
                  return (
                    <div
                      className={`absolute top-1.5 bottom-1.5 rounded overflow-hidden shadow-sm${barBg === null ? ` ${cfg.barClass}` : ''}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: barBg ?? undefined }}
                    >
                      {barBg !== null ? (
                        <div className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${fillPct}%` }} />
                      ) : (
                        <div className={`absolute inset-y-0 left-0 ${cfg.barFillClass}`} style={{ width: `${fillPct}%` }} />
                      )}
                      {barBg !== null && (
                        <span className={`absolute left-2 top-1/2 z-10 h-2 w-2 shrink-0 -translate-y-1/2 rounded-full ring-1 ring-white/60 ${cfg.barClass}`} />
                      )}
                      <span className={`relative z-10 flex h-full items-center truncate text-xs font-medium text-white leading-none ${barBg !== null ? 'pl-6 pr-2' : 'px-2'}`}>
                        {task.name}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeFeature() {
  const { data: tasksData } = useTasks({ limit: 500 });
  const { data: sentInvoices } = useInvoices({ status: 'sent' });
  const { data: proposalsData } = useBusinessProposals({ status: 'all' });
  const { data: revenueBreakdown } = useRevenueBreakdown(CURRENT_MONTH_FILTER);
  const { data: targets } = useBusinessTargets();

  const relevantTasks = (tasksData?.data ?? [])
    .filter((t) => t.status !== 'cancelled')
    .sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      return (
        (parseDate(a.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (parseDate(b.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .slice(0, 5);

  const unpaid = (sentInvoices ?? [])
    .slice()
    .sort(
      (a, b) => (parseDate(a.dueDate)?.getTime() ?? 0) - (parseDate(b.dueDate)?.getTime() ?? 0)
    );

  const pendingProposals = (proposalsData ?? [])
    .filter(
      (proposal) =>
        proposal.status === 'queued' ||
        proposal.status === 'in_progress' ||
        proposal.lifecycleStatus === 'sent',
    )
    .slice(0, 5);

  const incomeDistRows = (revenueBreakdown?.byCustomer ?? [])
    .slice()
    .sort((a, b) => parseFloat(b.revenue || 0) - parseFloat(a.revenue || 0))
    .slice(0, 5);
  const totalIncome = incomeDistRows.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);

  const targetHours = targets?.targetHoursPerMonth ?? 0;
  const currentHours = targets?.currentHours ?? 0;
  const hoursPct = targetHours > 0 ? Math.min(100, (currentHours / targetHours) * 100) : 0;
  const hoursRemaining = Math.max(0, targetHours - currentHours);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{HOME_TEXT.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{HOME_TEXT.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <h2 className="px-5 pt-5 pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {HOME_TEXT.ganttTitle}
          </h2>
          <HomeGantt tasks={relevantTasks} />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {HOME_TEXT.unpaidTitle}
          </h2>
          {unpaid.length ? (
            <div className="space-y-2">
              {unpaid.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-800">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inv.customerName} · {fmtDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {fmtMoney(inv.total, inv.currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{HOME_TEXT.unpaidEmpty}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {HOME_TEXT.pendingProposalsTitle}
          </h2>
          {pendingProposals.length ? (
            <div className="space-y-2">
              {pendingProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{proposal.customerName}</p>
                    <p className="text-xs text-slate-500">{fmtDate(proposal.createdAt)}</p>
                  </div>
                  <span className="text-xs font-medium text-indigo-600">
                    {proposal.lifecycleStatus === 'sent'
                      ? HOME_TEXT.labels.pendingDecision
                      : proposal.status === 'in_progress'
                      ? HOME_TEXT.labels.inProgress
                      : HOME_TEXT.labels.queued}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{HOME_TEXT.pendingProposalsEmpty}</p>
          )}
        </div>
      </div>

      {/* Monthly balance + hours target */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Income vs target donut */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex flex-col">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Income Target
          </h2>
          <p className="mb-4 text-xs text-slate-400">{MONTH_LABEL}</p>
          {(() => {
            const targetIncome = targets?.targetIncomePerMonth ?? 0;
            const currentIncome = targets?.currentIncome ?? 0;
            const incomePct = targetIncome > 0 ? Math.min(100, (currentIncome / targetIncome) * 100) : 0;
            const isOver = targetIncome > 0 && currentIncome > targetIncome;
            const arcColor = isOver ? '#f97316' : '#10b981';
            const incomeRemaining = Math.max(0, targetIncome - currentIncome);
            const pieData = targetIncome > 0
              ? isOver
                ? [{ value: 1, fill: arcColor }]
                : [{ value: currentIncome, fill: arcColor }, { value: incomeRemaining, fill: '#f1f5f9' }]
              : [{ value: 1, fill: '#f1f5f9' }];
            const currency = targets?.currency ?? 'USD';
            const fmtIncome = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
            return targetIncome > 0 ? (
              <div className="flex flex-1 items-center gap-6">
                <div className="relative shrink-0">
                  <PieChart width={120} height={120}>
                    <Pie data={pieData} cx={55} cy={55} innerRadius={36} outerRadius={52} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-lg font-bold ${isOver ? 'text-orange-500' : 'text-slate-900'}`}>
                      {Math.round(incomePct)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Earned</p>
                    <p className="font-bold text-slate-900">{fmtIncome(currentIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Target</p>
                    <p className="font-semibold text-slate-600">{fmtIncome(targetIncome)}</p>
                  </div>
                  {isOver ? (
                    <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                      +{fmtIncome(currentIncome - targetIncome)} above
                    </span>
                  ) : incomeRemaining > 0 ? (
                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>
                      <p className="font-semibold text-emerald-600">{fmtIncome(incomeRemaining)}</p>
                    </div>
                  ) : (
                    <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Target reached!</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No income target set. Go to Targets to set one.</p>
            );
          })()}
        </div>

        {/* Hours target donut */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex flex-col">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Work Hours Target
          </h2>
          <p className="mb-4 text-xs text-slate-400">{MONTH_LABEL}</p>
          {targetHours > 0 ? (() => {
            const isOver = currentHours > targetHours;
            const arcColor = isOver ? '#f97316' : '#10b981';
            const pieData = isOver
              ? [{ value: 1, fill: arcColor }]
              : [
                  { value: currentHours, fill: arcColor },
                  { value: hoursRemaining, fill: '#f1f5f9' },
                ];
            return (
              <div className="flex flex-1 items-center gap-6">
                <div className="relative shrink-0">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={pieData}
                      cx={55} cy={55}
                      innerRadius={36} outerRadius={52}
                      startAngle={90} endAngle={-270}
                      dataKey="value" strokeWidth={0}
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-lg font-bold ${isOver ? 'text-orange-500' : 'text-slate-900'}`}>
                      {Math.round(hoursPct)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Logged</p>
                    <p className="font-bold text-slate-900">{currentHours.toFixed(1)} h</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Target</p>
                    <p className="font-semibold text-slate-600">{targetHours} h</p>
                  </div>
                  {hoursRemaining > 0 && (
                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>
                      <p className="font-semibold text-emerald-600">{hoursRemaining.toFixed(1)} h</p>
                    </div>
                  )}
                  {isOver && (
                    <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                      +{(currentHours - targetHours).toFixed(1)} h over
                    </span>
                  )}
                  {!isOver && hoursRemaining === 0 && (
                    <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Target reached!
                    </span>
                  )}
                </div>
              </div>
            );
          })() : (
            <p className="text-sm text-slate-400">No hours target set. Go to Targets to set one.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {HOME_TEXT.incomeTitle}
        </h2>
        {incomeDistRows.length ? (
          <div className="space-y-2">
            {incomeDistRows.map((row) => {
              const revenue = parseFloat(row.revenue || 0);
              const pct = totalIncome > 0 ? (revenue / totalIncome) * 100 : 0;
              return (
                <div key={`${row.customerName}-${row.currency}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{row.customerName}</span>
                    <span className="font-medium text-slate-900">
                      {fmtMoney(revenue, row.currency)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{HOME_TEXT.incomeEmpty}</p>
        )}
      </div>
    </section>
  );
}
