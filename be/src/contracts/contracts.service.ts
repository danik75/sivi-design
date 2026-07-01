import { Injectable } from '@nestjs/common';
import { ContractRepository } from './contract.repository';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly repo: ContractRepository) {}

  findAll(customerId?: string, status?: string) {
    return this.repo.findAll(customerId, status as 'active' | 'inactive' | 'all');
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateContractDto) {
    return this.repo.create(dto);
  }

  deactivate(id: string) {
    return this.repo.deactivate(id);
  }
}
