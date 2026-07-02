import PropTypes from 'prop-types';
import { useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import FormField from '@/components/chadcn/FormField';
import Select from '@/components/chadcn/Select';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
  PROPOSAL_STATUSES,
} from '@/features/business-proposals/constants';
import BusinessProposalRow from '@/features/business-proposals/components/BusinessProposalRow';
import useBusinessProposals from '@/features/business-proposals/hooks/useBusinessProposals';
import useCustomers from '@/features/customers/hooks/useCustomers';

export default function BusinessProposalGrid({
  onCreate,
  onView,
  onResubmit,
  onUpdateLifecycle,
  onDelete,
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data, error, isError, isLoading, refetch } = useBusinessProposals({
    customerId: selectedCustomerId || undefined,
    status: selectedStatus || undefined,
  });
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({ limit: 10000 });

  const proposals = data ?? [];
  const customers = customersData?.data ?? [];
  const hasFilters = Boolean(selectedCustomerId) || Boolean(selectedStatus);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{BUSINESS_PROPOSALS_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{BUSINESS_PROPOSALS_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{BUSINESS_PROPOSALS_TEXT.addProposal}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,220px)] lg:items-end">
          <FormField label={BUSINESS_PROPOSALS_TEXT.filters.customerLabel}>
            <Select
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
            >
              <option value="">{BUSINESS_PROPOSALS_TEXT.filters.customerPlaceholder}</option>
              {isCustomersLoading ? (
                <option value="" disabled>
                  {BUSINESS_PROPOSALS_TEXT.filters.customerLoading}
                </option>
              ) : null}
              {isCustomersError ? (
                <option value="" disabled>
                  {BUSINESS_PROPOSALS_TEXT.filters.customerError}
                </option>
              ) : null}
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={BUSINESS_PROPOSALS_TEXT.filters.statusLabel}>
            <Select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="">{BUSINESS_PROPOSALS_TEXT.filters.statusPlaceholder}</option>
              {PROPOSAL_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {BUSINESS_PROPOSALS_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {BUSINESS_PROPOSALS_TEXT.loading}
        </div>
      ) : proposals.length ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.customer}</TableHeader>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.pricingModel}</TableHeader>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.status}</TableHeader>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.lifecycle}</TableHeader>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.createdAt}</TableHeader>
              <TableHeader>{BUSINESS_PROPOSALS_TEXT.headers.completedAt}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => (
              <BusinessProposalRow
                key={proposal.id}
                proposal={proposal}
                onView={onView}
                onResubmit={onResubmit}
                onUpdateLifecycle={onUpdateLifecycle}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={hasFilters ? '🔎' : '🧠'}
          title={
            hasFilters
              ? BUSINESS_PROPOSALS_TEXT.noResultsTitle
              : BUSINESS_PROPOSALS_TEXT.noDataTitle
          }
          description={
            hasFilters
              ? BUSINESS_PROPOSALS_TEXT.noResultsDescription
              : BUSINESS_PROPOSALS_TEXT.noDataDescription
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedCustomerId('');
                  setSelectedStatus('');
                }}
              >
                {BUSINESS_PROPOSALS_TEXT.clearFilters}
              </Button>
            ) : (
              <Button onClick={onCreate}>{BUSINESS_PROPOSALS_TEXT.addProposal}</Button>
            )
          }
        />
      )}
    </section>
  );
}

BusinessProposalGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onResubmit: PropTypes.func.isRequired,
  onUpdateLifecycle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
