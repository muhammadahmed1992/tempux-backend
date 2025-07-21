import {
  IsOptional,
  IsString,
  IsBooleanString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// DTO for nested 'role' filter (e.g., filter[role][in]=admin,editor)
export class RoleFilterDto {
  @IsOptional()
  @IsString({ message: 'Role "in" value must be a comma-separated string.' })
  in?: string; // Expecting "admin,editor" as a string
}

// DTO for nested 'createdAt' filter (e.g., filter[createdAt][gte]=2025-01-01)
export class CreatedAtFilterDto {
  @IsOptional()
  @IsString({
    message: 'Created at "gte" value must be a string (e.g., YYYY-MM-DD).',
  })
  gte?: string; // Expecting "2025-01-01" as a string
  // Add other date operators (lte, gt, lt) if needed
  @IsOptional()
  @IsString()
  lte?: string;

  @IsOptional()
  @IsString()
  gt?: string;

  @IsOptional()
  @IsString()
  lt?: string;
}

// NEW: Generic DTO for operator-based filters (e.g., { eq: 'value' }, { contains: 'value' })
// This DTO defines the string properties that will be received from the URL query.
export class OperatorFilterDto {
  @IsOptional()
  @IsString()
  eq?: string; // equals

  @IsOptional()
  @IsString()
  ne?: string; // not equals

  @IsOptional()
  @IsString()
  contains?: string; // string contains

  @IsOptional()
  @IsString()
  startsWith?: string;

  @IsOptional()
  @IsString()
  endsWith?: string;

  @IsOptional()
  @IsString()
  gt?: string; // greater than (for numbers/dates as strings)

  @IsOptional()
  @IsString()
  gte?: string; // greater than or equals

  @IsOptional()
  @IsString()
  lt?: string; // less than

  @IsOptional()
  @IsString()
  lte?: string; // less than or equals

  // For 'in' operator, it will be a comma-separated string initially
  @IsOptional()
  @IsString()
  in?: string;

  // Add other operators as needed (e.g., not, some, every, none for relations)
  // If you need to allow truly arbitrary operators without defining them here,
  // you would need to relax `forbidNonWhitelisted` on the ValidationPipe
  // or use a different strategy for the 'filter' DTO.
}

/**
 * DTO for the entire 'filter' query parameter object.
 * This will capture filter[isActive], filter[role], filter[createdAt], etc.
 * And now, it will also capture generic nested filters like filter[title][eq].
 */
export class GeneralFilterDto {
  @IsOptional()
  @ValidateNested() // Tells ValidationPipe to validate nested object
  @Type(() => RoleFilterDto) // Tells class-transformer to instantiate RoleFilterDto
  role?: RoleFilterDto;

  @IsOptional()
  @ValidateNested() // Tells ValidationPipe to validate nested object
  @Type(() => CreatedAtFilterDto) // Tells class-transformer to instantiate CreatedAtFilterDto
  createdAt?: CreatedAtFilterDto;

  // NEW: For generic fields that use operators (e.g., filter[title][eq])
  // We explicitly define them as nested DTOs that allow operator keys.
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatorFilterDto)
  title?: OperatorFilterDto; // For filter[title][eq]=...

  @IsOptional()
  @ValidateNested()
  @Type(() => OperatorFilterDto)
  name?: OperatorFilterDto; // For filter[name][contains]=...

  @IsOptional()
  @ValidateNested()
  @Type(() => OperatorFilterDto)
  email?: OperatorFilterDto; // For filter[email][eq]=...

  // Add other specific fields that might use OperatorFilterDto here.
  // Example:
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => OperatorFilterDto)
  // price?: OperatorFilterDto; // For filter[price][gte]=...
}
