import { IsEnum } from 'class-validator';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export class TransitionStatusDto {
  @IsEnum(['draft', 'sent', 'paid', 'cancelled'])
  status!: InvoiceStatus;
}
