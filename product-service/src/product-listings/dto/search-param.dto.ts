import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchParamDto {
  @IsString()
  @MinLength(3)
  search!: string;
}
