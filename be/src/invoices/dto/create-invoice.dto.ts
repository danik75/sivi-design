import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateLineItemDto } from './create-line-item.dto';

export class CreateInvoiceDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  contractId!: string;

  @IsDateString()
  issueDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems!: CreateLineItemDto[];
}
