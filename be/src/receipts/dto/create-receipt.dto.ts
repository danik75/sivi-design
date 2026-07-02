import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReceiptDto {
  @IsString()
  @IsNotEmpty()
  receiptNumber: string;

  @IsUUID()
  invoiceId: string;

  @IsDateString()
  paidAt: string;

  @IsString()
  @IsOptional()
  fileData?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileMimeType?: string;
}
