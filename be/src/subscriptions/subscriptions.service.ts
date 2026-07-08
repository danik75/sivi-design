import { Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionRepository } from './subscription.repository';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly repo: SubscriptionRepository) {}

  findAll(status?: string, customerId?: string) {
    return this.repo.findAll(status as 'active' | 'inactive' | 'all', customerId);
  }

  summary() {
    return this.repo.getSummary();
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateSubscriptionDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateSubscriptionDto) {
    return this.repo.update(id, dto);
  }

  deactivate(id: string) {
    return this.repo.deactivate(id);
  }
}
