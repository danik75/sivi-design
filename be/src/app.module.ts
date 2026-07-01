import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { CustomersModule } from './customers/customers.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [AuthModule, CustomersModule, ContractsModule, ExpensesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
