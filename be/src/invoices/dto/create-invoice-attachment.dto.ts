import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileData: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsOptional()
  fileMimeType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  fileSize?: number;
}
