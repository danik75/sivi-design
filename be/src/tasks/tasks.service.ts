import { Injectable } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly repo: TaskRepository) {}

  findAll(search?: string, status?: TaskStatus, customerId?: string, page?: number, limit?: number) {
    return this.repo.findAll(search, status, customerId, page, limit);
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateTaskDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.repo.update(id, dto);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }
}
