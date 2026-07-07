import { useQuery } from '@tanstack/react-query';
import * as api from '@/features/reports/services/reportsApi';

const q = (key, fn, opts) => useQuery(key, fn, { keepPreviousData: true, ...opts });

export const usePL = (p) => q(['report-pl', p], () => api.getPL(p));
export const useRevenueBreakdown = (p) =>
  q(['report-revenue-breakdown', p], () => api.getRevenueBreakdown(p));
export const useCustomerStatement = (id, p) =>
  q(['report-customer-statement', id, p], () => api.getCustomerStatement(id, p), { enabled: !!id });
export const useARaging = () => q(['report-ar-aging'], () => api.getARaging());
export const useTaxSummary = (p) => q(['report-tax-summary', p], () => api.getTaxSummary(p));
export const useExpenseAnalysis = (p) =>
  q(['report-expense-analysis', p], () => api.getExpenseAnalysis(p));
export const useCustomerProfitability = (p) =>
  q(['report-customer-profitability', p], () => api.getCustomerProfitability(p));
export const useForecast = () => q(['report-forecast'], () => api.getForecast());
export const useProjectStatus = (p) =>
  q(['report-project-status', p], () => api.getProjectStatus(p));
export const useCustomerTaskHours = (p) =>
  q(['report-customer-tasks', p], () => api.getCustomerTaskHours(p));
export const useTasksPerContract = (p) =>
  q(['report-tasks-per-contract', p], () => api.getTasksPerContract(p));
export const useTaskHistory = (p) =>
  q(['report-task-history', p], () => api.getTaskHistory(p));
