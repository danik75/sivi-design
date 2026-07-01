import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export enum ExpenseCategory {
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  SUBCONTRACTOR = 'subcontractor',
  TRAVEL = 'travel',
  OFFICE = 'office',
  OTHER = 'other',
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  vendor!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string;

  @IsDateString()
  date!: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
