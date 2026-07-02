import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefineBusinessProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  refinementText!: string;
}
