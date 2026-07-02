import { Injectable } from '@nestjs/common';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptsRepository } from './receipts.repository';

@Injectable()
export class ReceiptsService {
  constructor(private readonly repo: ReceiptsRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(dto: CreateReceiptDto) {
    return this.repo.create(dto);
  }
}
