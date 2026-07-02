import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('pl')
  getPL(@Query() q: Record<string, string>) {
    return this.service.getPL(ReportQueryDto.from(q));
  }

  @Get('revenue-breakdown')
  getRevenueBreakdown(@Query() q: Record<string, string>) {
    return this.service.getRevenueBreakdown(ReportQueryDto.from(q));
  }

  @Get('customer-statement/:customerId')
  async getCustomerStatement(
    @Param('customerId') customerId: string,
    @Query() q: Record<string, string>,
  ) {
    const result = await this.service.getCustomerStatement(customerId, ReportQueryDto.from(q));
    if (!result) throw new NotFoundException('Customer not found');
    return result;
  }

  @Get('ar-aging')
  getARaging() {
    return this.service.getARaging();
  }

  @Get('tax-summary')
  getTaxSummary(@Query() q: Record<string, string>) {
    return this.service.getTaxSummary(ReportQueryDto.from(q));
  }

  @Get('expense-analysis')
  getExpenseAnalysis(@Query() q: Record<string, string>) {
    return this.service.getExpenseAnalysis(ReportQueryDto.from(q));
  }

  @Get('customer-profitability')
  getCustomerProfitability(@Query() q: Record<string, string>) {
    return this.service.getCustomerProfitability(ReportQueryDto.from(q));
  }

  @Get('forecast')
  getForecast() {
    return this.service.getForecast();
  }

  @Get('project-status')
  getProjectStatus(@Query() q: Record<string, string>) {
    return this.service.getProjectStatus(ReportQueryDto.from({ period: 'monthly', year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1), ...q }));
  }
}
