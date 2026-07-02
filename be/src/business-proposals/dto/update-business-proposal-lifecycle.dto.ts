import { IsEnum } from 'class-validator';

export enum ProposalLifecycleStatus {
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class UpdateBusinessProposalLifecycleDto {
  @IsEnum(ProposalLifecycleStatus)
  lifecycleStatus!: ProposalLifecycleStatus;
}
