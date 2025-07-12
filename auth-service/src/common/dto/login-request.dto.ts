import { IsEmail, IsIn, IsString, MaxLength } from "class-validator";

export class LoginRequestDTO {
  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @MaxLength(150)
  password!: string;

  @IsIn([1, 2, 3, 4])
  userType!: number;
}
