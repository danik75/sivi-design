import { Injectable } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomerRepository) {}

  findAll(search?: string, page?: number, limit?: number) {
    return this.repo.findAll(search, page, limit);
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateCustomerDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.repo.update(id, dto);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }
}
