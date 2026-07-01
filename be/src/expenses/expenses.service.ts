import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseRepository } from './expense.repository';

@Injectable()
export class ExpensesService {
  constructor(private readonly repo: ExpenseRepository) {}

  findAll(customerId?: string, status?: string, category?: string) {
    return this.repo.findAll(customerId, status as 'active' | 'inactive' | 'all', category);
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateExpenseDto) {
    return this.repo.create(dto);
  }

  deactivate(id: string) {
    return this.repo.deactivate(id);
  }
}
