import { Body, Controller, Get, Put } from '@nestjs/common';
import { BusinessTargetsService } from './business-targets.service';
import { UpsertBusinessTargetsDto } from './dto/upsert-business-targets.dto';

@Controller('business-targets')
export class BusinessTargetsController {
  constructor(private readonly service: BusinessTargetsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Put()
  upsert(@Body() dto: UpsertBusinessTargetsDto) {
    return this.service.upsert(dto);
  }
}
