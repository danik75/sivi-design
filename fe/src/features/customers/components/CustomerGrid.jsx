import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import SearchInput from '@/components/chadcn/SearchInput';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import CustomerRow from '@/features/customers/components/CustomerRow';
import { CUSTOMER_TEXT, getApiErrorMessage } from '@/features/customers/constants';
import useCustomers from '@/features/customers/hooks/useCustomers';

const PAGE_SIZE = 8;

export default function CustomerGrid({
  onCreate,
  onEdit,
  onDelete,
  selectedCustomerId,
  onSelectCustomer,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, error, isError, isLoading, refetch } = useCustomers({ limit: 10000 });

  const allCustomers = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCustomers;
    return allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [allCustomers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const customers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasSearch = Boolean(search.trim());

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setPage(1);
  };

  const emptyStateAction = useMemo(() => {
    if (hasSearch) {
      return (
        <Button type="button" variant="ghost" onClick={handleSearchClear}>
          {CUSTOMER_TEXT.clearSearch}
        </Button>
      );
    }
    return <Button onClick={onCreate}>{CUSTOMER_TEXT.addCustomer}</Button>;
  }, [hasSearch, onCreate]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{CUSTOMER_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{CUSTOMER_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{CUSTOMER_TEXT.addCustomer}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
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
      ) : filtered.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{CUSTOMER_TEXT.headers.name}</TableHeader>
                <TableHeader>{CUSTOMER_TEXT.headers.companyNumber}</TableHeader>
                <TableHeader>{CUSTOMER_TEXT.headers.email}</TableHeader>
                <TableHeader>{CUSTOMER_TEXT.headers.phone}</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelect={onSelectCustomer}
                  isSelected={customer.id === selectedCustomerId}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {CUSTOMER_TEXT.pagination.label(safePage, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                {CUSTOMER_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
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
    </section>
  );
}

CustomerGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selectedCustomerId: PropTypes.string,
  onSelectCustomer: PropTypes.func,
};

CustomerGrid.defaultProps = {
  selectedCustomerId: null,
  onSelectCustomer: null,
};
