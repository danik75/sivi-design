import { Injectable } from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  getPL(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getPL(startDate, endDate);
  }

  getRevenueBreakdown(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getRevenueBreakdown(startDate, endDate);
  }

  getCustomerStatement(customerId: string, dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getCustomerStatement(customerId, startDate, endDate);
  }

  getARaging() {
    return this.repo.getARaging();
  }

  getTaxSummary(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getTaxSummary(startDate, endDate);
  }

  getExpenseAnalysis(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getExpenseAnalysis(startDate, endDate);
  }

  getCustomerProfitability(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getCustomerProfitability(startDate, endDate);
  }

  getForecast() {
    return this.repo.getForecast();
  }

  getProjectStatus(dto: ReportQueryDto) {
    return this.repo.getProjectStatus(dto.customerId, undefined);
  }

  getCustomerTaskHours(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getCustomerTaskHours(startDate, endDate, dto.customerId);
  }

  getTasksPerContract(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getTasksPerContract(startDate, endDate, dto.customerId);
  }

  getTaskHistory(dto: ReportQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getTaskHistory(startDate, endDate, dto.customerId);
  }
}
