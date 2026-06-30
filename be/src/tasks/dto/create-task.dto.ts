import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'done', 'cancelled'])
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
