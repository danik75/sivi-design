import { Injectable } from '@nestjs/common';
import { BillingQueryDto } from './dto/billing-query.dto';
import { BillingRepository } from './billing.repository';

@Injectable()
export class BillingService {
  constructor(private readonly repo: BillingRepository) {}

  getOverview(dto: BillingQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getOverview(startDate, endDate);
  }

  getCustomerDetail(customerId: string, dto: BillingQueryDto) {
    const { startDate, endDate } = dto.getBounds();
    return this.repo.getCustomerDetail(customerId, startDate, endDate);
  }

  getTrend(dto: BillingQueryDto) {
    return this.repo.getTrend(dto.period, dto.year, dto.month);
  }

  getCustomerTrend(customerId: string, dto: BillingQueryDto) {
    return this.repo.getCustomerTrend(customerId, dto.period, dto.year, dto.month);
  }
}
