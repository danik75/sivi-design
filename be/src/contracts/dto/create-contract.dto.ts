import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';

export enum ContractType {
  LUMP_SUM = 'lump_sum',
  TIME_AND_MATERIALS = 'time_and_materials',
  PREPAID_HOURS = 'prepaid_hours',
  MONTHLY_RETAINER = 'monthly_retainer',
}

export class CreateContractDto {
  @IsUUID()
  customerId!: string;

  @IsEnum(ContractType)
  type!: ContractType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  // --- Lump Sum ---
  @ValidateIf((o) => o.type === ContractType.LUMP_SUM)
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  // --- Time & Materials ---
  @ValidateIf((o) => o.type === ContractType.TIME_AND_MATERIALS)
  @IsNumber()
  @IsPositive()
  hourlyRate?: number;

  // --- Prepaid Hours ---
  @ValidateIf((o) => o.type === ContractType.PREPAID_HOURS)
  @IsNumber()
  @IsPositive()
  hoursPurchased?: number;

  @ValidateIf((o) => o.type === ContractType.PREPAID_HOURS)
  @IsNumber()
  @IsPositive()
  amountPaid?: number;

  // --- Monthly Retainer ---
  @ValidateIf((o) => o.type === ContractType.MONTHLY_RETAINER)
  @IsNumber()
  @IsPositive()
  monthlyFee?: number;

  @ValidateIf((o) => o.type === ContractType.MONTHLY_RETAINER)
  @IsNumber()
  @Min(0.5)
  hoursPerMonth?: number;

  // --- Shared currency (required for all monetary types except none) ---
  @ValidateIf((o) => o.type !== undefined)
  @IsString()
  @MaxLength(3)
  currency?: string;
}
