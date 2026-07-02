import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Badge from '@/components/chadcn/Badge';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import XIcon from '@/components/chadcn/icons/XIcon';
import {
  balanceClass,
  CONTRACT_TYPE_LABELS,
  formatAmount,
  MONTHS,
  TASK_STATUS_LABELS,
} from '@/features/billing/constants';
import { getStatusVariant } from '@/features/invoices/constants';
import useCustomerBilling from '@/features/billing/hooks/useCustomerBilling';
import useCustomerBillingTrend from '@/features/billing/hooks/useCustomerBillingTrend';
import ProfitabilityChart from './ProfitabilityChart';

const TABS = ['Invoices', 'Expenses', 'Tasks', 'Contracts'];

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

function periodLabel(period, year, month) {
  return period === 'monthly' ? `${MONTHS[month - 1]} ${year}` : String(year);
}

export default function CustomerBillingDetail({
  isOpen,
  customerId,
  period,
  year,
  month,
  onClose,
}) {
  const params = { period, year, month };
  const { data, isLoading, isError } = useCustomerBilling(isOpen ? customerId : null, params);
  const { data: trendData, isLoading: trendLoading } = useCustomerBillingTrend(
    isOpen ? customerId : null,
    params
  );
  const [activeTab, setActiveTab] = useState('Invoices');

  useEffect(() => {
    if (isOpen) setActiveTab('Invoices');
  }, [isOpen, customerId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal — fixed height, flex column */}
      <div
        className="flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl"
        style={{ height: '88vh' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header (fixed) ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{data?.customerName ?? '…'}</h2>
            <span className="text-sm text-slate-400">{periodLabel(period, year, month)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isLoading && <div className="py-16 text-center text-sm text-slate-400">Loading…</div>}
          {isError && (
            <div className="m-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Failed to load customer billing data.
            </div>
          )}

          {data && (
            <>
              {/* ── Balance cards (fixed) ── */}
              <div className="shrink-0 px-6 pt-5">
                <div className="grid grid-cols-3 gap-4">
                  {data.balance.length === 0 ? (
                    <p className="col-span-3 text-sm text-slate-400">
                      No paid invoices in this period.
                    </p>
                  ) : (
                    data.balance.map((b) => (
                      <div key={b.currency} className="contents">
                        <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Paid Income
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {parseFloat(b.paidInvoicesTotal).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            <span className="text-sm font-normal text-slate-500">{b.currency}</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Expenses
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {parseFloat(b.expensesTotal).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            <span className="text-sm font-normal text-slate-500">{b.currency}</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Net Balance
                          </span>
                          <span className={`text-lg font-bold ${balanceClass(b.balance)}`}>
                            {formatAmount(b.balance, b.currency)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Trend chart (fixed) ── */}
              <div className="shrink-0 px-6 pt-4">
                <ProfitabilityChart data={trendData} isLoading={trendLoading} />
              </div>

              {/* ── Tab bar (fixed) ── */}
              <div className="mx-6 mt-4 shrink-0 border-b border-slate-100">
                <div className="flex">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                      <span className="ml-1.5 text-xs text-slate-400">
                        ({data[tab.toLowerCase()]?.length ?? 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Grid (scrollable) ── */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                {activeTab === 'Invoices' && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Invoice #</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Issue Date</TableHeader>
                        <TableHeader>Due Date</TableHeader>
                        <TableHeader>Total</TableHeader>
                        <TableHeader>Currency</TableHeader>
                        <TableHeader>Contract</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                            No invoices
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(inv.status)}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(inv.issueDate)}</TableCell>
                            <TableCell>{formatDate(inv.dueDate)}</TableCell>
                            <TableCell className="tabular-nums">
                              {parseFloat(inv.total).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{inv.currency}</TableCell>
                            <TableCell>
                              {CONTRACT_TYPE_LABELS[inv.contractType] ?? inv.contractType ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {activeTab === 'Expenses' && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Vendor</TableHeader>
                        <TableHeader>Category</TableHeader>
                        <TableHeader>Amount</TableHeader>
                        <TableHeader>Currency</TableHeader>
                        <TableHeader>Date</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                            No expenses
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.expenses.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell className="font-medium text-slate-800">
                              {exp.vendor}
                            </TableCell>
                            <TableCell className="capitalize">{exp.category ?? '—'}</TableCell>
                            <TableCell className="tabular-nums">
                              {parseFloat(exp.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{exp.currency}</TableCell>
                            <TableCell>{formatDate(exp.date)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {activeTab === 'Tasks' && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Start</TableHeader>
                        <TableHeader>End</TableHeader>
                        <TableHeader>Est. Hours</TableHeader>
                        <TableHeader>% Done</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                            No tasks
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium text-slate-800">
                              {task.name}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                                {TASK_STATUS_LABELS[task.status] ?? task.status}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(task.startDate)}</TableCell>
                            <TableCell>{formatDate(task.endDate)}</TableCell>
                            <TableCell>{task.estimatedHours ?? '—'}</TableCell>
                            <TableCell>{task.percentComplete ?? 0}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {activeTab === 'Contracts' && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Rate / Amount</TableHeader>
                        <TableHeader>Currency</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.contracts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                            No contracts
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.contracts.map((con) => {
                          const rateDisplay = con.hourlyRate
                            ? `${parseFloat(con.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}/hr`
                            : con.monthlyFee
                              ? `${parseFloat(con.monthlyFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo`
                              : con.totalAmount
                                ? parseFloat(con.totalAmount).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                  })
                                : '—';
                          return (
                            <TableRow key={con.id}>
                              <TableCell>
                                {CONTRACT_TYPE_LABELS[con.type] ?? con.type ?? '—'}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                                  {con.status}
                                </span>
                              </TableCell>
                              <TableCell className="tabular-nums">{rateDisplay}</TableCell>
                              <TableCell>{con.currency ?? '—'}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

CustomerBillingDetail.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  customerId: PropTypes.string,
  period: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

CustomerBillingDetail.defaultProps = {
  customerId: null,
};
