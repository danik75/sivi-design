import { Controller, Get, Param, Query } from '@nestjs/common';
import { BillingQueryDto } from './dto/billing-query.dto';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('overview')
  getOverview(@Query() query: Record<string, string>) {
    const dto = BillingQueryDto.from(query);
    return this.service.getOverview(dto);
  }

  @Get('trend')
  getTrend(@Query() query: Record<string, string>) {
    const dto = BillingQueryDto.from(query);
    return this.service.getTrend(dto);
  }

  @Get('customer/:customerId/trend')
  getCustomerTrend(
    @Param('customerId') customerId: string,
    @Query() query: Record<string, string>,
  ) {
    const dto = BillingQueryDto.from(query);
    return this.service.getCustomerTrend(customerId, dto);
  }

  @Get('customer/:customerId')
  getCustomerDetail(
    @Param('customerId') customerId: string,
    @Query() query: Record<string, string>,
  ) {
    const dto = BillingQueryDto.from(query);
    return this.service.getCustomerDetail(customerId, dto);
  }
}
