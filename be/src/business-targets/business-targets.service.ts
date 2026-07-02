import { Injectable } from '@nestjs/common';
import { BusinessTargetsRepository } from './business-targets.repository';
import { UpsertBusinessTargetsDto } from './dto/upsert-business-targets.dto';

@Injectable()
export class BusinessTargetsService {
  constructor(private readonly repo: BusinessTargetsRepository) {}

  get() {
    return this.repo.get();
  }

  upsert(dto: UpsertBusinessTargetsDto) {
    return this.repo.upsert(dto);
  }
}
