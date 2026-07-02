import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import Button from '@/components/chadcn/Button';
import FormField from '@/components/chadcn/FormField';
import Input from '@/components/chadcn/Input';
import useBusinessTargets from './hooks/useBusinessTargets';
import useUpdateBusinessTargets from './hooks/useUpdateBusinessTargets';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);
}

function fmtCurrency(n, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
}

function ProgressCard({ label, current, target, formatFn }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const over = target > 0 && current > target;
  const remaining = Math.max(0, target - current);
  const arcColor = over ? '#f97316' : '#10b981';
  const pieData = target > 0
    ? over
      ? [{ value: 1, fill: arcColor }]
      : [{ value: current, fill: arcColor }, { value: remaining, fill: '#f1f5f9' }]
    : [{ value: 1, fill: '#f1f5f9' }];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex items-center gap-6">
        {/* Donut */}
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
            <span className={`text-lg font-bold ${over ? 'text-orange-500' : 'text-slate-900'}`}>
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 min-w-0">
          <div>
            <p className="text-xs text-slate-400">Current</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">{formatFn(current)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Target</p>
            <p className="text-sm font-semibold text-slate-500">{target > 0 ? formatFn(target) : '—'}</p>
          </div>
          {target > 0 && (
            <div>
              {over ? (
                <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                  +{formatFn(current - target)} above
                </span>
              ) : (
                <span className="text-xs text-slate-400">{formatFn(remaining)} remaining</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessTargetsFeature() {
  const { data, isLoading, isError } = useBusinessTargets();
  const mutation = useUpdateBusinessTargets();

  const [hours, setHours] = useState('');
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setHours(String(data.targetHoursPerMonth ?? ''));
    setIncome(String(data.targetIncomePerMonth ?? ''));
    setCurrency(data.currency ?? 'USD');
  }, [data]);

  function handleSave(e) {
    e.preventDefault();
    mutation.mutate(
      {
        targetHoursPerMonth: parseFloat(hours) || 0,
        targetIncomePerMonth: parseFloat(income) || 0,
        currency: currency.trim().toUpperCase() || 'USD',
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Business Targets</h1>
        <p className="mt-2 text-sm text-slate-500">
          Set your monthly goals and track progress against them.
        </p>
      </div>

      {/* Progress cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-rose-600">Unable to load targets.</p>
      ) : (
        <>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {monthLabel} progress
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProgressCard
                label="Work hours"
                current={data?.currentHours ?? 0}
                target={data?.targetHoursPerMonth ?? 0}
                formatFn={(n) => `${fmt(n)} h`}
              />
              <ProgressCard
                label="Income"
                current={data?.currentIncome ?? 0}
                target={data?.targetIncomePerMonth ?? 0}
                formatFn={(n) => fmtCurrency(n, data?.currency)}
              />
            </div>
          </div>

          {/* Edit form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-5 text-sm font-semibold text-slate-800">Edit Targets</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Target work hours / month">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 160"
                  />
                </FormField>
                <FormField label="Target income / month">
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 10000"
                  />
                </FormField>
              </div>
              <FormField label="Currency">
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
                  maxLength={3}
                  className="w-24"
                />
              </FormField>

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Saving…' : 'Save Targets'}
                </Button>
                {saved && (
                  <span className="text-sm font-medium text-emerald-600">Saved!</span>
                )}
                {mutation.isError && (
                  <span className="text-sm text-rose-600">Failed to save.</span>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
