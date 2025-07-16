import { IsOptional, IsString, IsIn, IsObject } from "class-validator";
import { Type } from "class-transformer";

export class GetAllQueryDTO {
  @IsOptional()
  @Type(() => Number)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize = 20;

  @IsOptional()
  @IsString()
  sortBy = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "asc";

  @IsOptional()
  @IsObject()
  filter?: object;

  @IsOptional()
  select?: object;
}
