import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class OTPVerificationRequestDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  otp!: string;

  @IsNotEmpty()
  @IsIn([1, 2, 3, 4])
  userType!: number;
}
