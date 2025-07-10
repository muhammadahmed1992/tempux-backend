import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class ResendOTPDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsNotEmpty()
  @IsIn([1, 2, 3, 4])
  userType!: number;
}
