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
  resetToken!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  otp!: string;
}
