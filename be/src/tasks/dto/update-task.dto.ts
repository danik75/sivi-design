import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentComplete?: number;

  // Hours the task actually took — captured when completing a task.
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;
}
