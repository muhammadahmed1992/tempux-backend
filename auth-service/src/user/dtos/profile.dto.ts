import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsArray,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  telephone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  aboutMe?: string;
}

export class ProfileResponseDto {
  id!: bigint;
  name!: string;
  email!: string;
  fullName?: string | null;
  telephone?: string | null;
  gender?: string;
  dateOfBirth?: Date;
  occupation?: string;
  languages?: string[];
  aboutMe?: string;
  googleId?: string | null;
  facebookId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ProfileSummaryDto {
  id!: bigint;
  name!: string;
  email!: string;
  fullName?: string | null;
  avatar?: string;
}

export class SocialAccountDto {
  provider!: 'google' | 'facebook';
  isLinked!: boolean;
  email?: string | null;
}

export class SocialAccountsResponseDto {
  google?: SocialAccountDto;
  facebook?: SocialAccountDto;
}

export class LoginInfoResponseDto {
  email!: string;
  lastLoginAt?: Date;
  isEmailVerified!: boolean;
}

export class PasswordUpdateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,30}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,30}$/,
    {
      message:
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,30}$/,
    {
      message:
        'Confirm password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  confirmPassword!: string;
}
