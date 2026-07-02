import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import EmptyState from '@/components/chadcn/EmptyState';
import FormField from '@/components/chadcn/FormField';
import Dropdown from '@/components/chadcn/Dropdown';
import Table, { TableBody, TableHead, TableHeader, TableRow } from '@/components/chadcn/Table';
import useCustomers from '@/features/customers/hooks/useCustomers';
import InvoiceOverview from '@/features/invoices/components/InvoiceOverview';
import InvoiceRow from '@/features/invoices/components/InvoiceRow';
import { getApiErrorMessage, INVOICE_STATUSES, INVOICE_TEXT } from '@/features/invoices/constants';
import useInvoices from '@/features/invoices/hooks/useInvoices';

const PAGE_SIZE = 10;

export default function InvoiceGrid({ onCreate, onEdit, onDelete, onStatusTransition }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const handleView = (invoice) => {
    setSelectedInvoiceId((prev) => (prev === invoice.id ? null : invoice.id));
  };

  const { data, error, isError, isLoading, refetch } = useInvoices({
    customerId: selectedCustomerId || undefined,
    status: selectedStatus || undefined,
  });
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useCustomers({ limit: 10000 });

  const allInvoices = data ?? [];
  const customers = customersData?.data ?? [];
  const hasFilters = Boolean(selectedCustomerId) || Boolean(selectedStatus);
  const totalPages = Math.max(1, Math.ceil(allInvoices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const invoices = allInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const emptyStateAction = useMemo(() => {
    if (hasFilters) {
      return (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSelectedCustomerId('');
            setSelectedStatus('');
            setPage(1);
          }}
        >
          {INVOICE_TEXT.clearFilters}
        </Button>
      );
    }

    return <Button onClick={onCreate}>{INVOICE_TEXT.addInvoice}</Button>;
  }, [hasFilters, onCreate]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{INVOICE_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{INVOICE_TEXT.description}</p>
        </div>
        <Button onClick={onCreate}>{INVOICE_TEXT.addInvoice}</Button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,220px)] lg:items-end">
          <FormField label={INVOICE_TEXT.filters.customerLabel}>
            <Dropdown
              value={selectedCustomerId}
              onChange={(val) => { setSelectedCustomerId(val); setPage(1); }}
              options={[
                { value: '', label: isCustomersLoading ? INVOICE_TEXT.filters.customerLoading : isCustomersError ? INVOICE_TEXT.filters.customerError : INVOICE_TEXT.filters.customerPlaceholder },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </FormField>

          <FormField label={INVOICE_TEXT.filters.statusLabel}>
            <Dropdown
              value={selectedStatus}
              onChange={(val) => { setSelectedStatus(val); setPage(1); }}
              options={[
                { value: '', label: INVOICE_TEXT.filters.statusPlaceholder },
                ...INVOICE_STATUSES,
              ]}
            />
          </FormField>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(error, INVOICE_TEXT.loadError)}
            </p>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              {INVOICE_TEXT.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {INVOICE_TEXT.loading}
        </div>
      ) : allInvoices.length ? (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{INVOICE_TEXT.headers.invoiceNumber}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.customer}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.contract}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.status}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.issueDate}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.dueDate}</TableHeader>
                <TableHeader>{INVOICE_TEXT.headers.total}</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusTransition={onStatusTransition}
                  onView={handleView}
                  isSelected={invoice.id === selectedInvoiceId}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {INVOICE_TEXT.pagination.label(safePage, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
              >
                {INVOICE_TEXT.pagination.previous}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                {INVOICE_TEXT.pagination.next}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={
            hasFilters ? INVOICE_TEXT.emptyStateIcons.filtered : INVOICE_TEXT.emptyStateIcons.empty
          }
          title={hasFilters ? INVOICE_TEXT.noResultsTitle : INVOICE_TEXT.noDataTitle}
          description={
            hasFilters ? INVOICE_TEXT.noResultsDescription : INVOICE_TEXT.noDataDescription
          }
          action={emptyStateAction}
        />
      )}

      {selectedInvoiceId ? (
        <InvoiceOverview
          isOpen={Boolean(selectedInvoiceId)}
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      ) : null}
    </section>
  );
}

InvoiceGrid.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusTransition: PropTypes.func.isRequired,
};
