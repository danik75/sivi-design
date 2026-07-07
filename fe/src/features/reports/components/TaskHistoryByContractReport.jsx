import PropTypes from 'prop-types';
import { useState } from 'react';
import Dropdown from '@/components/chadcn/Dropdown';
import { fmtDate } from '@/features/reports/constants';
import { useTaskHistory } from '@/features/reports/hooks';
import PeriodFilter from './shared/PeriodFilter';
import ReportShell from './shared/ReportShell';

const now = new Date();
// History defaults to the current year.
const DEFAULT_FILTER = { period: 'yearly', year: now.getFullYear(), month: now.getMonth() + 1 };

const h = (v) => (v == null ? '—' : `${Number(v)}h`);
const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const NO_CONTRACT = '__none__';

export default function TaskHistoryByContractReport({ customers = [] }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [customerId, setCustomerId] = useState('');
  const [contractId, setContractId] = useState('');

  const params = {
    ...(filter.period === 'range'
      ? { period: 'range', from: filter.from, to: filter.to }
      : filter.period === 'yearly'
        ? { period: 'yearly', year: filter.year }
        : { period: 'monthly', year: filter.year, month: filter.month }),
    ...(customerId ? { customerId } : {}),
  };

  const { data, isLoading, isError, refetch } = useTaskHistory(params);
  const groups = data?.customers ?? [];
  const singleCustomer = Boolean(customerId);

  // Contract options built from the fetched data (+ "All" and "No contract").
  const contractOptions = [
    { value: '', label: 'All contracts' },
    { value: NO_CONTRACT, label: 'No contract' },
    ...groups.flatMap((cust) =>
      (cust.contracts ?? []).map((c) => ({
        value: c.contractId,
        label: singleCustomer ? c.contractLabel : `${cust.customerName} — ${c.contractLabel}`,
      }))
    ),
  ];

  // Flatten to rows: Customer → each contract's tasks, then the No-contract bucket,
  // respecting the contract filter.
  const tableRows = [];
  const showContract = contractId !== NO_CONTRACT; // hide contract tasks when "No contract" selected
  const showUnassigned = contractId === '' || contractId === NO_CONTRACT;
  for (const cust of groups) {
    if (showContract) {
      for (const contract of cust.contracts ?? []) {
        if (contractId && contractId !== NO_CONTRACT && contract.contractId !== contractId) continue;
        for (const t of contract.tasks ?? []) {
          tableRows.push({
            Customer: cust.customerName,
            Contract: contract.contractLabel,
            Task: t.name,
            Start: fmtDate(t.startDate),
            End: fmtDate(t.endDate),
            Status: STATUS_LABELS[t.status] ?? t.status,
            'Est. (h)': h(t.estimatedHours),
            'Actual (h)': h(t.actualHours),
          });
        }
      }
    }
    if (showUnassigned) {
      for (const t of cust.unassignedTasks ?? []) {
        tableRows.push({
          Customer: cust.customerName,
          Contract: '— No contract —',
          Task: t.name,
          Start: fmtDate(t.startDate),
          End: fmtDate(t.endDate),
          Status: STATUS_LABELS[t.status] ?? t.status,
          'Est. (h)': h(t.estimatedHours),
          'Actual (h)': h(t.actualHours),
        });
      }
    }
  }

  const tableHeaders = [
    'Customer',
    'Contract',
    'Task',
    'Start',
    'End',
    'Status',
    'Est. (h)',
    'Actual (h)',
  ];

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <PeriodFilter value={filter} onChange={setFilter} />
      <div className="w-44">
        <Dropdown
          value={customerId}
          onChange={(v) => {
            setCustomerId(v);
            setContractId('');
          }}
          placeholder="All customers"
          options={[
            { value: '', label: 'All customers' },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>
      <div className="w-44">
        <Dropdown
          value={contractId}
          onChange={setContractId}
          placeholder="All contracts"
          options={contractOptions}
        />
      </div>
    </div>
  );

  return (
    <ReportShell
      title="Task History by Customer / Contract"
      controls={controls}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      emptyMessage="No tasks in this period."
      chartContent={
        <p className="text-xs text-slate-400">
          Tasks grouped by customer and contract. Tasks not tied to a contract appear under
          &ldquo;No contract&rdquo;.
        </p>
      }
    />
  );
}

TaskHistoryByContractReport.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
};
