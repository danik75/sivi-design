import api from '@/services/api';

const r = (path, params) => api.get(`/reports/${path}`, { params }).then((res) => res.data);

export const getPL = (p) => r('pl', p);
export const getRevenueBreakdown = (p) => r('revenue-breakdown', p);
export const getCustomerStatement = (id, p) => r(`customer-statement/${id}`, p);
export const getARaging = () => r('ar-aging');
export const getTaxSummary = (p) => r('tax-summary', p);
export const getExpenseAnalysis = (p) => r('expense-analysis', p);
export const getCustomerProfitability = (p) => r('customer-profitability', p);
export const getForecast = () => r('forecast');
export const getProjectStatus = (p) => r('project-status', p);
export const getCustomerTaskHours = (p) => r('customer-tasks', p);
export const getTasksPerContract = (p) => r('tasks-per-contract', p);
export const getTaskHistory = (p) => r('task-history', p);
