import { IsEmail, IsNotEmpty } from 'class-validator';

export interface ResendOTPDTO {
  token: string;
}
export class ResetPasswordRequestDTO {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
