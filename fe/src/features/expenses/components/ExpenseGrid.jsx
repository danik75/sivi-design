import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import FormField from '@/components/chadcn/FormField';
import Dropdown from '@/components/chadcn/Dropdown';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import ExpenseRow from '@/features/expenses/components/ExpenseRow';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TEXT,
  getApiErrorMessage,
} from '@/features/expenses/constants';
import useExpenses from '@/features/expenses/hooks/useExpenses';
import useCustomers from '@/features/customers/hooks/useCustomers';

const PAGE_SIZE = 10;

export default function ExpenseGrid({ onCreate, onDeactivate }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

  const { data, error, isError, isLoading, refetch } = useExpenses({
    customerId: selectedCustomerId || undefined,
    status: showAll ? 'all' : 'active',
    category: selectedCategory || undefined,
  });
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({
    limit: 10000,
  });

  const allExpenses = data ?? [];
  const customers = customersData?.data ?? [];
  const hasFilters = Boolean(selectedCustomerId) || Boolean(selectedCategory) || showAll;
  const totalPages = Math.max(1, Math.ceil(allExpenses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const expenses = allExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const emptyStateAction = useMemo(() => {
    if (hasFilters) {
      return (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSelectedCustomerId('');
            setSelectedCategory('');
            setShowAll(false);
            setPage(1);
          }}
        >
          {EXPENSE_TEXT.clearFilters}
        </Button>
      );
    }

    return <Button onClick={onCreate}>{EXPENSE_TEXT.addExpense}</Button>;
  }, [hasFilters, onCreate]);

  const handleShowActive = () => {
    setShowAll(false);
    setPage(1);
  };

  const handleShowAll = () => {
    setShowAll(true);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{EXPENSE_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{EXPENSE_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{EXPENSE_TEXT.addExpense}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,220px)_auto] lg:items-end">
          <FormField label={EXPENSE_TEXT.filters.customerLabel}>
            <Dropdown
              value={selectedCustomerId}
              onChange={(val) => { setSelectedCustomerId(val); setPage(1); }}
              options={[
                { value: '', label: isCustomersLoading ? EXPENSE_TEXT.filters.customerLoading : isCustomersError ? EXPENSE_TEXT.filters.customerError : EXPENSE_TEXT.filters.customerPlaceholder },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </FormField>

          <FormField label={EXPENSE_TEXT.filters.categoryLabel}>
            <Dropdown
              value={selectedCategory}
              onChange={(val) => { setSelectedCategory(val); setPage(1); }}
              options={[
                { value: '', label: EXPENSE_TEXT.filters.categoryPlaceholder },
                ...EXPENSE_CATEGORIES,
              ]}
            />
          </FormField>

          <FormField label={EXPENSE_TEXT.filters.statusLabel}>
            <div className="flex w-fit overflow-hidden rounded-lg border border-slate-200">
              <Button
                type="button"
                variant={showAll ? 'ghost' : 'primary'}
                onClick={handleShowActive}
              >
                {EXPENSE_TEXT.filters.active}
              </Button>
              <Button type="button" variant={showAll ? 'primary' : 'ghost'} onClick={handleShowAll}>
                {EXPENSE_TEXT.filters.all}
              </Button>
            </div>
          </FormField>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, EXPENSE_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {EXPENSE_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {EXPENSE_TEXT.loading}
        </div>
      ) : allExpenses.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{EXPENSE_TEXT.headers.vendor}</TableHeader>
                <TableHeader>{EXPENSE_TEXT.headers.category}</TableHeader>
                <TableHeader>{EXPENSE_TEXT.headers.amount}</TableHeader>
                <TableHeader>{EXPENSE_TEXT.headers.customer}</TableHeader>
                <TableHeader>{EXPENSE_TEXT.headers.date}</TableHeader>
                <TableHeader>{EXPENSE_TEXT.headers.status}</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} onDeactivate={onDeactivate} />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {EXPENSE_TEXT.pagination.label(safePage, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
              >
                {EXPENSE_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                {EXPENSE_TEXT.pagination.next}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={
            hasFilters ? EXPENSE_TEXT.emptyStateIcons.filtered : EXPENSE_TEXT.emptyStateIcons.empty
          }
          title={hasFilters ? EXPENSE_TEXT.noResultsTitle : EXPENSE_TEXT.noDataTitle}
          description={
            hasFilters ? EXPENSE_TEXT.noResultsDescription : EXPENSE_TEXT.noDataDescription
          }
          action={emptyStateAction}
        />
      )}
    </section>
  );
}

ExpenseGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
};
