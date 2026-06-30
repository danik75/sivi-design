import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import SearchInput from '@/components/chadcn/SearchInput';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import CustomerRow from '@/features/customers/components/CustomerRow';
import { CUSTOMER_TEXT, getApiErrorMessage } from '@/features/customers/constants';
import useCustomers from '@/features/customers/hooks/useCustomers';

export default function CustomerGrid({ onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, error, isError, isLoading, isFetching, refetch } = useCustomers({
    search: debouncedSearch,
    page,
  });

  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasSearch = Boolean(debouncedSearch);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const emptyStateAction = useMemo(() => {
    if (hasSearch) {
      return (
        <Button type="button" variant="ghost" onClick={() => setSearch('')}>
          {CUSTOMER_TEXT.clearSearch}
        </Button>
      );
    }

    return <Button onClick={onCreate}>{CUSTOMER_TEXT.addCustomer}</Button>;
  }, [hasSearch, onCreate]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{CUSTOMER_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{CUSTOMER_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{CUSTOMER_TEXT.addCustomer}</Button>
      </div>

      <div className="rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={CUSTOMER_TEXT.searchPlaceholder}
        />
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, CUSTOMER_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {CUSTOMER_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {CUSTOMER_TEXT.loading}
        </div>
      ) : customers.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{CUSTOMER_TEXT.headers.name}</TableHeader>
                <TableHeader>{CUSTOMER_TEXT.headers.email}</TableHeader>
                <TableHeader>{CUSTOMER_TEXT.headers.phone}</TableHeader>
                <TableHeader>
                  <div className="text-right">{CUSTOMER_TEXT.headers.actions}</div>
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {CUSTOMER_TEXT.pagination.label(page, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1 || isFetching}
              >
                {CUSTOMER_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page >= totalPages || isFetching}
              >
                {CUSTOMER_TEXT.pagination.next}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={hasSearch ? '🔎' : '👥'}
          title={hasSearch ? CUSTOMER_TEXT.noResultsTitle : CUSTOMER_TEXT.noDataTitle}
          description={
            hasSearch ? CUSTOMER_TEXT.noResultsDescription : CUSTOMER_TEXT.noDataDescription
          }
          action={emptyStateAction}
        />
      )}

      {!isLoading && isFetching ? (
        <div className="text-right text-xs text-slate-400">{CUSTOMER_TEXT.loading}</div>
      ) : null}
    </section>
  );
}

CustomerGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
