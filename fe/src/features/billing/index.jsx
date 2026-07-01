import { useMemo, useState } from 'react';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import { balanceClass, CHART_COLORS, formatAmount } from '@/features/billing/constants';
import useBillingOverview from '@/features/billing/hooks/useBillingOverview';
import useBillingTrend from '@/features/billing/hooks/useBillingTrend';
import CustomerBillingDetail from './components/CustomerBillingDetail';
import IncomeChart from './components/IncomeChart';
import PeriodSelector from './components/PeriodSelector';
import ProfitabilityChart from './components/ProfitabilityChart';

const now = new Date();

function TotalCards({ customers }) {
  const totals = useMemo(() => {
    if (!customers?.length) return [];
    const byCurrency = {};
    for (const c of customers) {
      for (const curr of c.currencies) {
        if (!byCurrency[curr.currency]) {
          byCurrency[curr.currency] = { currency: curr.currency, income: 0, expenses: 0 };
        }
        byCurrency[curr.currency].income += parseFloat(curr.paidInvoicesTotal);
        byCurrency[curr.currency].expenses += parseFloat(curr.expensesTotal);
      }
    }
    return Object.values(byCurrency).map((t) => ({
      ...t,
      balance: t.income - t.expenses,
    }));
  }, [customers]);

  if (!totals.length) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      {totals.map((t) => (
        <div key={t.currency} className="contents">
          <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Income
            </span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {t.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="ml-1 text-sm font-normal text-slate-400">{t.currency}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Expenses
            </span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {t.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="ml-1 text-sm font-normal text-slate-400">{t.currency}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Net Balance
            </span>
            <span className={`text-2xl font-bold tabular-nums ${balanceClass(t.balance)}`}>
              {formatAmount(t.balance, t.currency)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BillingFeature() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const params = period === 'monthly' ? { period, year, month } : { period, year };
  const { data: customers, isLoading, isError, refetch } = useBillingOverview(params);
  const { data: trendData, isLoading: trendLoading } = useBillingTrend(params);

  function handlePeriodChange({ period: p, year: y, month: m }) {
    setPeriod(p);
    setYear(y);
    setMonth(m);
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

      {/* Period totals */}
      {!isLoading && !isError && customers?.length > 0 && (
        <TotalCards customers={customers} />
      )}

      {/* Trend chart — always shown (uses its own loading state) */}
      <ProfitabilityChart data={trendData} isLoading={trendLoading} />

      {/* Loading overview */}
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
          <button type="button" onClick={refetch} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {/* Customer breakdown */}
      {!isLoading && !isError && customers && (
        <>
          {customers.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16">
              <p className="text-sm text-slate-400">No paid invoices found for this period.</p>
            </div>
          ) : (
            <>
              <IncomeChart customers={customers} onSliceClick={setSelectedCustomerId} />

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
                                  style={{ backgroundColor: CHART_COLORS[ci % CHART_COLORS.length] }}
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

      <CustomerBillingDetail
        isOpen={Boolean(selectedCustomerId)}
        customerId={selectedCustomerId}
        period={period}
        year={year}
        month={month}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
