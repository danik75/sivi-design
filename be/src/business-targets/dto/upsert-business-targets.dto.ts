import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpsertBusinessTargetsDto {
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  targetHoursPerMonth: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  targetIncomePerMonth: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
