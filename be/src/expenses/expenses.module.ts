import { Module } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseRepository],
})
export class ExpensesModule {}
