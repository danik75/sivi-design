import PropTypes from 'prop-types';
import { useState } from 'react';
import Badge from '@/components/chadcn/Badge';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';
import {
  balanceClass,
  CONTRACT_TYPE_LABELS,
  formatAmount,
  MONTHS,
  TASK_STATUS_LABELS,
} from '@/features/billing/constants';
import { getStatusVariant } from '@/features/invoices/constants';
import useCustomerBilling from '@/features/billing/hooks/useCustomerBilling';

const TABS = ['Invoices', 'Expenses', 'Tasks', 'Contracts'];

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

function periodLabel(period, year, month) {
  return period === 'monthly' ? `${MONTHS[month - 1]} ${year}` : String(year);
}

export default function CustomerBillingDetail({ customerId, period, year, month, onBack }) {
  const params = { period, year, month };
  const { data, isLoading, isError } = useCustomerBilling(customerId, params);
  const [activeTab, setActiveTab] = useState('Invoices');

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-90" />
          Overview
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">
          {data?.customerName ?? '…'}
        </h1>
        <span className="text-sm text-slate-400">{periodLabel(period, year, month)}</span>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
      )}
      {isError && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          Failed to load customer billing data.
        </div>
      )}

      {data && (
        <>
          {/* Balance summary bar */}
          <div className="grid grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            {data.balance.length === 0 ? (
              <p className="col-span-3 text-sm text-slate-400">
                No paid invoices in this period.
              </p>
            ) : (
              data.balance.map((b) => (
                <div key={b.currency} className="contents">
                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
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
                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
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
                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
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

          {/* Tabs */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
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

            <div className="overflow-x-auto">
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
                            {parseFloat(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                          <TableCell className="font-medium text-slate-800">{exp.vendor}</TableCell>
                          <TableCell className="capitalize">{exp.category ?? '—'}</TableCell>
                          <TableCell className="tabular-nums">
                            {parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                          <TableCell className="font-medium text-slate-800">{task.name}</TableCell>
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
                        const rateDisplay =
                          con.hourlyRate
                            ? `${parseFloat(con.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}/hr`
                            : con.monthlyFee
                            ? `${parseFloat(con.monthlyFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo`
                            : con.totalAmount
                            ? parseFloat(con.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })
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
          </div>
        </>
      )}
    </div>
  );
}

CustomerBillingDetail.propTypes = {
  customerId: PropTypes.string.isRequired,
  period: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
};
