import { Module } from '@nestjs/common';
import { ContractRepository } from './contract.repository';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, ContractRepository],
})
export class ContractsModule {}
