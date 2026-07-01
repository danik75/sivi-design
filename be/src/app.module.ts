import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { ContractsModule } from './contracts/contracts.module';
import { CustomersModule } from './customers/customers.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [AuthModule, BillingModule, CustomersModule, ContractsModule, ExpensesModule, InvoicesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
