import { Module } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceRepository],
})
export class InvoicesModule {}
