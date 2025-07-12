import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ResendOTPDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;
}
