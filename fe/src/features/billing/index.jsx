import { useState } from 'react';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import { balanceClass, CHART_COLORS, formatAmount } from '@/features/billing/constants';
import useBillingOverview from '@/features/billing/hooks/useBillingOverview';
import CustomerBillingDetail from './components/CustomerBillingDetail';
import IncomeChart from './components/IncomeChart';
import PeriodSelector from './components/PeriodSelector';

const now = new Date();

export default function BillingFeature() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const params = period === 'monthly' ? { period, year, month } : { period, year };
  const { data: customers, isLoading, isError, refetch } = useBillingOverview(params);

  function handlePeriodChange({ period: p, year: y, month: m }) {
    setPeriod(p);
    setYear(y);
    setMonth(m);
    setSelectedCustomerId(null);
  }

  if (selectedCustomerId) {
    return (
      <CustomerBillingDetail
        customerId={selectedCustomerId}
        period={period}
        year={year}
        month={month}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Revenue and expenses summary by period.</p>
        </div>
        <PeriodSelector
          period={period}
          year={year}
          month={month}
          onChange={handlePeriodChange}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          Failed to load billing data.
          <button
            type="button"
            onClick={refetch}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data */}
      {!isLoading && !isError && customers && (
        <>
          {customers.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24">
              <p className="text-sm text-slate-400">No paid invoices found for this period.</p>
            </div>
          ) : (
            <>
              {/* Pie chart */}
              <IncomeChart
                customers={customers}
                onSliceClick={setSelectedCustomerId}
              />

              {/* Summary table */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Customer</TableHeader>
                      <TableHeader>Currency</TableHeader>
                      <TableHeader>Paid Income</TableHeader>
                      <TableHeader>Expenses</TableHeader>
                      <TableHeader>Balance</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer, ci) =>
                      customer.currencies.map((c, idx) => (
                        <TableRow
                          key={`${customer.customerId}-${c.currency}`}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedCustomerId(customer.customerId)}
                        >
                          {idx === 0 ? (
                            <TableCell
                              rowSpan={customer.currencies.length}
                              className="align-middle"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[ci % CHART_COLORS.length],
                                  }}
                                />
                                <span className="font-medium text-slate-800 hover:text-indigo-600">
                                  {customer.customerName}
                                </span>
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell className="text-slate-500">{c.currency}</TableCell>
                          <TableCell className="tabular-nums">
                            {parseFloat(c.paidInvoicesTotal).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {parseFloat(c.expensesTotal).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className={`tabular-nums ${balanceClass(c.balance)}`}>
                            {formatAmount(c.balance, c.currency)}
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
