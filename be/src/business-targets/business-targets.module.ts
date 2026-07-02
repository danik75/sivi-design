import { Module } from '@nestjs/common';
import { BusinessTargetsController } from './business-targets.controller';
import { BusinessTargetsRepository } from './business-targets.repository';
import { BusinessTargetsService } from './business-targets.service';

@Module({
  controllers: [BusinessTargetsController],
  providers: [BusinessTargetsService, BusinessTargetsRepository],
})
export class BusinessTargetsModule {}
