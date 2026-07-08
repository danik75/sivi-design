import { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Badge from '@/components/chadcn/Badge';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import Dropdown from '@/components/chadcn/Dropdown';
import EmptyState from '@/components/chadcn/EmptyState';
import PencilIcon from '@/components/chadcn/icons/PencilIcon';
import XIcon from '@/components/chadcn/icons/XIcon';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import useToast from '@/components/chadcn/useToast';
import {
  EXPENSE_CATEGORY_MAP,
  formatAmount,
  getApiErrorMessage,
  getStatusVariant,
} from '@/features/expenses/constants';
import {
  useDeactivateSubscription,
  useSubscriptions,
  useSubscriptionSummary,
} from '@/features/expenses/hooks/useSubscriptions';
import SubscriptionModal from '@/features/expenses/components/SubscriptionModal';

const PIE_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#14b8a6',
  '#64748b',
];

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SubscriptionsPanel() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('active');
  const [modal, setModal] = useState(null); // { subscription } | { } for create
  const [deactivate, setDeactivate] = useState(null);

  const { data: subscriptions = [], isLoading } = useSubscriptions({ status });
  const { data: summary } = useSubscriptionSummary();

  const deactivateMutation = useDeactivateSubscription();

  const active = subscriptions.filter((s) => s.status === 'active');
  const pieData = useMemo(
    () => active.map((s) => ({ name: s.name, value: Number(s.monthlyAmount) })),
    [active]
  );
  const totals = summary?.totalsByCurrency ?? [];

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setModal(null);
    setDeactivate(null);
  };

  const confirmDeactivate = () => {
    deactivateMutation.mutate(deactivate.id, {
      onSuccess: () => handleSuccess(`${deactivate.name} cancelled.`),
      onError: (error) =>
        showToast(getApiErrorMessage(error, 'Unable to cancel subscription.'), 'error'),
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Subscriptions</h2>
          <p className="mt-1 text-sm text-slate-500">Recurring monthly payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Dropdown
              value={status}
              onChange={setStatus}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'all', label: 'All' },
                { value: 'inactive', label: 'Cancelled' },
              ]}
            />
          </div>
          <Button onClick={() => setModal({})}>Add Subscription</Button>
        </div>
      </div>

      {/* Summary + pie */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total monthly recurring
            </p>
            {totals.length ? (
              totals.map((t) => (
                <p key={t.currency} className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                  {formatAmount(t.monthlyTotal, t.currency)}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {t.count} {t.count === 1 ? 'subscription' : 'subscriptions'}
                  </span>
                </p>
              ))
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-300">—</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subscriptions by monthly fee
          </p>
          {pieData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e) => `${e.name}: ${e.value}`}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${Number(v)}`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No active subscriptions.</p>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Loading subscriptions...
        </div>
      ) : subscriptions.length ? (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Monthly fee</TableHeader>
                <TableHeader>Renewal day</TableHeader>
                <TableHeader>Next renewal</TableHeader>
                <TableHeader>Start date</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmount(s.monthlyAmount, s.currency)}
                  </TableCell>
                  <TableCell>{s.renewalDay}</TableCell>
                  <TableCell>{fmtDate(s.nextRenewalDate)}</TableCell>
                  <TableCell>{fmtDate(s.startDate)}</TableCell>
                  <TableCell>{s.category ? EXPENSE_CATEGORY_MAP[s.category] ?? s.category : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(s.status)}>
                      {s.status === 'active' ? 'Active' : 'Cancelled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 !p-0 shrink-0"
                        onClick={() => setModal({ subscription: s })}
                        aria-label="Edit subscription"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      {s.status === 'active' ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="h-8 w-8 !p-0 shrink-0"
                          onClick={() => setDeactivate(s)}
                          aria-label="Cancel subscription"
                        >
                          <XIcon />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon="🔁"
          title="No subscriptions yet"
          description="Add a recurring subscription to track monthly spend."
          action={<Button onClick={() => setModal({})}>Add Subscription</Button>}
        />
      )}

      <SubscriptionModal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        subscription={modal?.subscription}
        onSuccess={handleSuccess}
      />

      <Dialog
        isOpen={Boolean(deactivate)}
        onClose={() => setDeactivate(null)}
        title="Cancel Subscription"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeactivate(null)}>
              Keep
            </Button>
            <Button type="button" variant="danger" onClick={confirmDeactivate}>
              Cancel subscription
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel <span className="font-semibold text-slate-800">{deactivate?.name}</span>? It will be
          marked inactive and removed from the monthly total.
        </p>
      </Dialog>
    </section>
  );
}
