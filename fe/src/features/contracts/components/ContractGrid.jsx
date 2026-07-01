import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import FormField from '@/components/chadcn/FormField';
import Select from '@/components/chadcn/Select';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import ContractRow from '@/features/contracts/components/ContractRow';
import { CONTRACT_TEXT, getApiErrorMessage } from '@/features/contracts/constants';
import useContracts from '@/features/contracts/hooks/useContracts';
import useCustomers from '@/features/customers/hooks/useCustomers';

const PAGE_SIZE = 10;

export default function ContractGrid({ onCreate, onDeactivate }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

  const { data, error, isError, isLoading, refetch } = useContracts({
    customerId: selectedCustomerId || undefined,
    status: showAll ? 'all' : 'active',
  });
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({
    limit: 10000,
  });

  const allContracts = data?.data ?? data ?? [];
  const customers = customersData?.data ?? [];
  const hasFilters = Boolean(selectedCustomerId) || showAll;
  const totalPages = Math.max(1, Math.ceil(allContracts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const contracts = allContracts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const emptyStateAction = useMemo(() => {
    if (hasFilters) {
      return (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSelectedCustomerId('');
            setShowAll(false);
            setPage(1);
          }}
        >
          {CONTRACT_TEXT.clearFilters}
        </Button>
      );
    }

    return <Button onClick={onCreate}>{CONTRACT_TEXT.addContract}</Button>;
  }, [hasFilters, onCreate]);

  const handleCustomerChange = (event) => {
    setSelectedCustomerId(event.target.value);
    setPage(1);
  };

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
          <h1 className="text-3xl font-bold text-slate-900">{CONTRACT_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{CONTRACT_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{CONTRACT_TEXT.addContract}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_auto] lg:items-end">
          <FormField label={CONTRACT_TEXT.filters.customerLabel}>
            <Select value={selectedCustomerId} onChange={handleCustomerChange}>
              <option value="">{CONTRACT_TEXT.filters.customerPlaceholder}</option>
              {isCustomersLoading ? (
                <option value="" disabled>
                  {CONTRACT_TEXT.filters.customerLoading}
                </option>
              ) : null}
              {isCustomersError ? (
                <option value="" disabled>
                  {CONTRACT_TEXT.filters.customerError}
                </option>
              ) : null}
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={CONTRACT_TEXT.filters.statusLabel}>
            <div className="flex w-fit overflow-hidden rounded-lg border border-slate-200">
              <Button
                type="button"
                variant={showAll ? 'ghost' : 'primary'}
                onClick={handleShowActive}
              >
                {CONTRACT_TEXT.filters.active}
              </Button>
              <Button type="button" variant={showAll ? 'primary' : 'ghost'} onClick={handleShowAll}>
                {CONTRACT_TEXT.filters.all}
              </Button>
            </div>
          </FormField>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, CONTRACT_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {CONTRACT_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {CONTRACT_TEXT.loading}
        </div>
      ) : allContracts.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{CONTRACT_TEXT.headers.name}</TableHeader>
                <TableHeader>{CONTRACT_TEXT.headers.type}</TableHeader>
                <TableHeader>{CONTRACT_TEXT.headers.details}</TableHeader>
                <TableHeader>{CONTRACT_TEXT.headers.status}</TableHeader>
                <TableHeader>{CONTRACT_TEXT.headers.created}</TableHeader>
                <TableHeader>{CONTRACT_TEXT.headers.expires}</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <ContractRow key={contract.id} contract={contract} onDeactivate={onDeactivate} />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {CONTRACT_TEXT.pagination.label(safePage, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
              >
                {CONTRACT_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                {CONTRACT_TEXT.pagination.next}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={
            hasFilters
              ? CONTRACT_TEXT.emptyStateIcons.filtered
              : CONTRACT_TEXT.emptyStateIcons.empty
          }
          title={hasFilters ? CONTRACT_TEXT.noResultsTitle : CONTRACT_TEXT.noDataTitle}
          description={
            hasFilters ? CONTRACT_TEXT.noResultsDescription : CONTRACT_TEXT.noDataDescription
          }
          action={emptyStateAction}
        />
      )}
    </section>
  );
}

ContractGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
};
