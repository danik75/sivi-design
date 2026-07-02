import { Module } from '@nestjs/common';
import { BusinessProposalsController } from './business-proposals.controller';
import { BusinessProposalsService } from './business-proposals.service';
import { BusinessProposalRepository } from './business-proposal.repository';

@Module({
  controllers: [BusinessProposalsController],
  providers: [BusinessProposalsService, BusinessProposalRepository],
})
export class BusinessProposalsModule {}
