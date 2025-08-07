import {
  IsString,
  IsEmail,
  MaxLength,
  IsIn,
  IsOptional,
  IsNotEmpty,
  MinLength,
  Matches,
} from "class-validator";

export class CreateUserDto {
  // TODO: User name is optional for now.
  @IsOptional()
  @IsString()
  @MaxLength(15)
  username!: string;

  @IsString()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "New password is required." })
  @MinLength(8, { message: "New password must be at least 8 characters long." })
  @MaxLength(30, { message: "New password cannot exceed 30 characters." })
  // Example of a strong password regex (at least one uppercase, one lowercase, one number, one special character)
  // Adjust this regex based on your specific password policy
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/,
    {
      message:
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }
  )
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName!: string;
}
