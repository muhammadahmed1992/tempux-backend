import { IsOptional, IsString, IsIn, IsObject } from "class-validator";
import { Type } from "class-transformer";
import { CustomFilter } from "@Common/enums/custom-filter.enum";

export class GetAllQueryDTO {
  @IsOptional()
  @Type(() => Number)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize = 20;

  @IsOptional()
  @IsObject()
  orderBy?: object;

  @IsOptional()
  @IsObject()
  where?: object;

  @IsOptional()
  select?: object;

  @IsOptional()
  customCategoryExpression?: CustomFilter;
}
