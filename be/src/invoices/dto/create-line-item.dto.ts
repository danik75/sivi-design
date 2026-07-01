import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export type LineItemSourceType = 'task' | 'expense' | 'contract' | 'manual';

export class CreateLineItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsEnum(['task', 'expense', 'contract', 'manual'])
  sourceType?: LineItemSourceType;

  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
