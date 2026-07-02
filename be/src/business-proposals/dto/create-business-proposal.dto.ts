import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum ProposalPricingModel {
  FIXED_FEE = 'fixed_fee',
  TIME_AND_MATERIALS = 'time_and_materials',
  CAPPED_HOURS_BUNDLE = 'capped_hours_bundle',
  MONTHLY_RETAINER = 'monthly_retainer',
}

export enum ProposalLanguage {
  EN = 'en',
  HE = 'he',
}

const HOURLY_MODELS = [
  ProposalPricingModel.TIME_AND_MATERIALS,
  ProposalPricingModel.CAPPED_HOURS_BUNDLE,
  ProposalPricingModel.MONTHLY_RETAINER,
];

export class CreateBusinessProposalDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  businessRequirement!: string;

  @IsEnum(ProposalPricingModel)
  pricingModel!: ProposalPricingModel;

  @ValidateIf((dto: CreateBusinessProposalDto) =>
    HOURLY_MODELS.includes(dto.pricingModel),
  )
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  estimatedHours?: number;

  @ValidateIf(
    (dto: CreateBusinessProposalDto) =>
      dto.pricingModel === ProposalPricingModel.TIME_AND_MATERIALS ||
      dto.pricingModel === ProposalPricingModel.MONTHLY_RETAINER,
  )
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hourlyRate?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  paymentDistribution!: string;

  @IsOptional()
  @IsEnum(ProposalLanguage)
  requestedLanguage?: ProposalLanguage;
}
