import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResendOTPDTO {
  token!: string;
}
