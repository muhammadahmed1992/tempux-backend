import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ForgotPasswordDTO {
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required.' })
  @MinLength(8, {
    message: 'Confirm password must be at least 8 characters long.',
  })
  @MaxLength(30, { message: 'Confirm password cannot exceed 30 characters.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/,
    {
      message:
        'Confirm password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  confirmPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @MaxLength(30, { message: 'New password cannot exceed 30 characters.' })
  // Example of a strong password regex (at least one uppercase, one lowercase, one number, one special character)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/,
    {
      message:
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  resetToken!: string;
}
