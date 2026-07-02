import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { BusinessProposalsModule } from './business-proposals/business-proposals.module';
import { BusinessTargetsModule } from './business-targets/business-targets.module';
import { ContractsModule } from './contracts/contracts.module';
import { CustomersModule } from './customers/customers.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    AuthModule,
    BillingModule,
    BusinessProposalsModule,
    BusinessTargetsModule,
    CustomersModule,
    ContractsModule,
    ExpensesModule,
    InvoicesModule,
    ReceiptsModule,
    ReportsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
