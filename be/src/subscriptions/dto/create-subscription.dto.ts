import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '../../expenses/dto/create-expense.dto';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsNumber()
  @IsPositive()
  monthlyAmount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string;

  @IsInt()
  @Min(1)
  @Max(31)
  renewalDay!: number;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
