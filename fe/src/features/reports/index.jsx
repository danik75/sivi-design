import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { REPORT_GROUPS } from './constants';
import ARAgingReport from './components/ARAgingReport';
import CustomerProfitabilityReport from './components/CustomerProfitabilityReport';
import CustomerStatementReport from './components/CustomerStatementReport';
import CustomerTaskHoursReport from './components/CustomerTaskHoursReport';
import ExpenseAnalysisReport from './components/ExpenseAnalysisReport';
import ForecastReport from './components/ForecastReport';
import PLReport from './components/PLReport';
import ProjectStatusReport from './components/ProjectStatusReport';
import RevenueBreakdownReport from './components/RevenueBreakdownReport';
import TaskHistoryByContractReport from './components/TaskHistoryByContractReport';
import TasksPerContractReport from './components/TasksPerContractReport';
import TaxSummaryReport from './components/TaxSummaryReport';

const REPORT_META = {
  pl: { label: 'P&L Statement', component: PLReport },
  'revenue-breakdown': { label: 'Revenue Breakdown', component: RevenueBreakdownReport },
  'customer-statement': { label: 'Customer Statement', component: CustomerStatementReport },
  'ar-aging': { label: 'AR Aging', component: ARAgingReport },
  'tax-summary': { label: 'Tax Summary', component: TaxSummaryReport },
  'expense-analysis': { label: 'Expense Analysis', component: ExpenseAnalysisReport },
  'customer-profitability': {
    label: 'Customer Profitability',
    component: CustomerProfitabilityReport,
  },
  forecast: { label: 'Revenue Forecast', component: ForecastReport },
  'project-status': { label: 'Project Status', component: ProjectStatusReport },
  'customer-tasks': { label: 'Task Hours & Cost', component: CustomerTaskHoursReport },
  'tasks-per-contract': { label: 'Tasks per Contract', component: TasksPerContractReport },
  'task-history': { label: 'Task History', component: TaskHistoryByContractReport },
};

export default function ReportsFeature() {
  const [active, setActive] = useState('pl');

  const { data: customersPage } = useQuery(['customers'], () =>
    api.get('/customers').then((r) => r.data)
  );
  const customers = customersPage?.data ?? [];

  const meta = REPORT_META[active];
  const Component = meta?.component;
  const needsCustomers = [
    'customer-statement',
    'project-status',
    'customer-tasks',
    'tasks-per-contract',
    'task-history',
  ].includes(active);

  return (
    <div className="flex h-full min-h-0">
      {/* Report selector sidebar */}
      <aside className="w-52 shrink-0 border-r border-slate-100 bg-slate-50/60 py-4 overflow-y-auto">
        {REPORT_GROUPS.map((g) => (
          <div key={g.label} className="mb-4">
            <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {g.label}
            </p>
            {g.reports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(r.id)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  active === r.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 border-l-2 border-transparent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Report content */}
      <main className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">{meta?.label}</h2>
        {Component && (needsCustomers ? <Component customers={customers} /> : <Component />)}
      </main>
    </div>
  );
}
