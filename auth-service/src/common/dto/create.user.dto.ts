import {
  IsString,
  IsEmail,
  MaxLength,
  IsIn,
  IsOptional,
  IsNotEmpty,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @MaxLength(15)
  username!: string;

  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @MaxLength(150)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @IsNotEmpty()
  @IsIn([1, 2, 3, 4])
  userType!: number;
}
