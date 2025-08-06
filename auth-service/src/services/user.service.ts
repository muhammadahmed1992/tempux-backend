import bcrypt from 'bcrypt';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import { UserRepository } from '@Repository/users.repository';
import { EmailTemplateType } from '@EmailFactory/email.template.type';
import Constants from '@Helper/constants';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { Utils } from '@Common/utils';
import { EmailService } from '@Services/email.service';

import { OTPVerificationRequestDTO } from '@DTO/otp.verification.dto';
import { ResendOTPDTO, ResetPasswordRequestDTO } from '@DTO/resend.otp.dto';
import {
  SocialLoginResponseDTO,
  SocialLoginVerifyUserResponseDTO,
} from '@DTO/social-login-response.dto';
import { CreateUserDto } from '@DTO/create.user.dto';
import { LoginRequestDTO } from '@DTO/login-request.dto';
import { LoginDTO } from '@DTO/login.dto';
import { EncryptionHelper } from '@Helper/encryption.helper';
import { ForgotPasswordDTO } from '@DTO/update.password.dto';
import { UserDetailsResponseDto } from '@DTO/user.details.response.dto';

@Injectable()
export class UserService {
  private readonly SALT_ROUND: number;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly encryptionHelper: EncryptionHelper,
  ) {
    this.SALT_ROUND = Number(this.configService.get<number>('SALT_ROUND')!);
    if (!this.SALT_ROUND)
      throw new InternalServerErrorException(
        'Please check SALT_ROUND environment variable. It is missing or invalid',
      );
  }

  async create(user: CreateUserDto): Promise<ApiResponse<boolean>> {
    try {
      //If user already exists returns an error
      const isExists = await this.userRepository.validateUser(
        user.email,
        user.userType,
        {
          id: true,
        },
      );
      if (isExists) {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.USER_ALREADY_EXISTS,
          false,
          HttpStatus.FOUND,
        );
      }
      const hashedPassword = await bcrypt.hash(user.password, this.SALT_ROUND);
      const otpResponse = await this.generateOTPAndExpiry();
      const result = await this.userRepository.createUser(
        {
          name: user.username || user.email,
          email: user.email,
          password: hashedPassword,
          full_name: user.fullName,
          userType: {
            connect: {
              id: user.userType,
            },
          },
          otp: otpResponse.otp,
          otp_expires_at: otpResponse.otp_expiry_date_time,
        },
        {
          id: true,
        },
      );
      this.sendOTPInEmail(
        user.email,
        {
          otp: otpResponse.plainOTP,
          resetToken: this.encryptionHelper.encrypt(user.email),
        },
        EmailTemplateType.OTP_VERIFICATION,
      );
      return ResponseHelper.CreateResponse<boolean>(
        Constants.USER_CREATED_SUCCESS,
        result.id ? true : false,
        HttpStatus.CREATED,
      );
    } catch (e: unknown) {
      console.error(e);
      return ResponseHelper.CreateResponse<boolean>(
        Constants.ERROR_MESSAGE,
        false,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(
    request: LoginRequestDTO | SocialLoginResponseDTO,
  ): Promise<ApiResponse<LoginDTO>> {
    const user = await this.userRepository.validateUser(
      request.email,
      request.userType,
    );
    if (!user)
      return ResponseHelper.CreateResponse<LoginDTO>(
        Constants.USER_NOT_FOUND,
        { accessToken: '', userName: '' },
        HttpStatus.NOT_FOUND,
      );
    if (!user.otp_verified) {
      // return ResponseHelper.CreateResponse<LoginDTO>(
      //   Constants.USER_NOT_VERIFIED,
      //   { accessToken: '', userName: '' },
      //   HttpStatus.BAD_REQUEST,
      // );
      // TODO: Code optimization...
      // Send OTP to the user's email.
      const otpResponse = await this.generateOTPAndExpiry();
      const token = this.encryptionHelper.encrypt(user.email);
      this.sendOTPInEmail(
        user.email,
        { otp: otpResponse.plainOTP, resetToken: token },
        EmailTemplateType.OTP_VERIFICATION,
      );
      await this.userRepository.update(
        {
          email_user_type: {
            user_type: user.user_type,
            email: user.email,
          },
        },
        {
          otp: otpResponse.otp,
          otp_expires_at: otpResponse.otp_expiry_date_time,
        },
      );
      return ResponseHelper.CreateResponse<LoginDTO>(
        Constants.USER_NOT_VERIFIED,
        {
          resetToken: token,
        },
        HttpStatus.TEMPORARY_REDIRECT,
      );
    }
    if (request instanceof LoginRequestDTO) {
      const isPasswordValid = await bcrypt.compare(
        request.password,
        user.password,
      );

      if (!isPasswordValid)
        return ResponseHelper.CreateResponse<LoginDTO>(
          Constants.USER_NOT_FOUND,
          { accessToken: '', userName: '' },
          HttpStatus.NOT_FOUND,
        );
    }

    const payload = {
      sub: Number(user.id),
      email: user.email,
      userType: user.user_type,
    };
    const token = await this.jwtService.signAsync(payload);
    return ResponseHelper.CreateResponse<LoginDTO>(
      Constants.USER_LOGGED_IN_SUCCESSFULLY,
      { accessToken: token, userName: user.full_name || 'N/A' },
      HttpStatus.OK,
    );
  }

  async verifyOTP(
    request: OTPVerificationRequestDTO,
  ): Promise<ApiResponse<boolean>> {
    const email = this.encryptionHelper.decrypt(request.resetToken);
    const user = await this.userRepository.findFirstUserByEmail(email);
    if (!user)
      return ResponseHelper.CreateResponse<boolean>(
        Constants.USER_NOT_FOUND,
        false,
        HttpStatus.NOT_FOUND,
      );
    const isOTPValid = await bcrypt.compare(request.otp, user.otp!);
    const notExpired = new Date() <= user.otp_expires_at!;
    // TODO: Might need to use UTC date here
    if (isOTPValid) {
      if (notExpired) {
        //Update Flag inside the DB
        await this.verifyOTPUpdate(user.id);
        return ResponseHelper.CreateResponse<boolean>(
          Constants.USER_VERIFIED,
          true,
          HttpStatus.OK,
        );
      } else {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.EXPIRED_OTP,
          false,
          HttpStatus.EXPECTATION_FAILED,
        );
      }
    } else {
      return ResponseHelper.CreateResponse<boolean>(
        Constants.INVALID_OTP,
        false,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async generateResetPasswordLink(
    request: ResetPasswordRequestDTO,
    emailType: EmailTemplateType,
  ): Promise<ApiResponse<boolean>> {
    return this.resentOTPHelper(request.email, emailType);
  }

  async resendOTP(
    request: ResendOTPDTO,
    emailType: EmailTemplateType,
  ): Promise<ApiResponse<boolean>> {
    const email = this.encryptionHelper.decrypt(request.token);
    return this.resentOTPHelper(email, emailType);
  }

  async forgotPassword(
    request: ForgotPasswordDTO,
  ): Promise<ApiResponse<boolean>> {
    const email = this.encryptionHelper.decrypt(request.resetToken);
    const user = await this.userRepository.findFirstUserByEmail(email);
    if (user) {
      const newPassword = await bcrypt.hash(
        request.newPassword,
        this.SALT_ROUND,
      );
      const result = await this.userRepository.update(
        { id: user.id },
        {
          password: newPassword,
        },
        {
          id: true,
        },
      );
      if (result.id) {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.PASSWORD_UPDATE_SUCCESS,
          true,
          HttpStatus.OK,
        );
      } else {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.SOMETHING_WENT_WRONG,
          false,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      return ResponseHelper.CreateResponse<boolean>(
        Constants.INVALID_EMAIL,
        false,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * @param email. Accepts an email of the user which is requesting otp for reset-password or verify-user/account
   * @param emailTemplateType: Accepts a template type of the email which will be send to the user.
   * @returns Promise<Apiresponse<boolean>> which will shows if the user exists/operation succeed properly or not.
   */
  private async resentOTPHelper(
    email: string,
    emailType: EmailTemplateType,
  ): Promise<ApiResponse<boolean>> {
    const checkEmail = await this.userRepository.findFirstUserByEmail(email);
    if (checkEmail) {
      const otpRes = await this.generateOTPAndExpiry();
      const token = await this.encryptionHelper.encrypt(email);
      const [updateResult, emailResult] = await Promise.allSettled([
        this.userRepository.update(
          { id: checkEmail.id },
          {
            otp: otpRes.otp,
            otp_expires_at: otpRes.otp_expiry_date_time,
            otp_verified: false,
          },
        ),
        this.sendOTPInEmail(
          checkEmail.email,
          { otp: otpRes.plainOTP, resetToken: token },
          emailType,
        ),
      ]);

      // Check the status of the email sending promise
      if (emailResult.status === 'rejected') {
        console.error('Failed to send email:', emailResult.reason);
        // You might still decide to throw an error here,
        // or handle the failure in a different way.
        throw new BadRequestException(
          'Failed to send OTP email. Please try again.',
        );
      }

      // Check the status of the database update promise
      if (updateResult.status === 'rejected') {
        console.error('Failed to update user:', updateResult.reason);
        // Handle the database error
        throw new BadRequestException(
          'Failed to update user record. Please contact support.',
        );
      }

      return ResponseHelper.CreateResponse<boolean>(
        Constants.OTP_RESEND,
        true,
        HttpStatus.ACCEPTED,
      );
    } else {
      return ResponseHelper.CreateResponse<boolean>(
        Constants.SOMETHING_WENT_WRONG,
        false,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validates a social user (Google/Facebook).
   * Finds an existing user by socialId, or creates a new one.
   * @param provider - 'google' or 'facebook'
   * @param socialId - The unique ID from the social provider
   * @param email - The user's email from the social profile
   * @param name - The user's name from the social profile
   * @returns The user object from your database.
   */
  async validateSocialUser(
    provider: 'google' | 'facebook',
    socialId: string,
    email: string,
    userType: number,
  ): Promise<
    ApiResponse<SocialLoginResponseDTO | SocialLoginVerifyUserResponseDTO>
  > {
    const socialLoginFields = {
      google: 'googleId',
      facebook: 'facebookId',
    };
    // Determine which ID field to use
    const socialIdField = socialLoginFields[provider];

    // Try to find the user by their social ID
    const user = await this.userRepository.findUserBySocialId(
      socialIdField,
      socialId,
      {
        id: true,
        email: true,
        user_type: true,
        otp_verified: true,
      },
    );

    if (user) {
      // User found, return it
      if (user.otp_verified) {
        return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
          Constants.USER_ALREADY_VERIFIED,
          {
            id: Number(user.id),
            email: user.email,
            userType: user.user_type,
          },
          HttpStatus.OK,
        );
      }
      // TODO: Code optimization...
      // Send OTP to the user's email.
      const otpResponse = await this.generateOTPAndExpiry();
      const token = this.encryptionHelper.encrypt(user.email);
      this.sendOTPInEmail(
        email,
        { otp: otpResponse.plainOTP, resetToken: token },
        EmailTemplateType.OTP_VERIFICATION,
      );
      await this.userRepository.update(
        {
          email_user_type: {
            user_type: user.user_type,
            email: user.email,
          },
        },
        {
          otp: otpResponse.otp,
          otp_expires_at: otpResponse.otp_expiry_date_time,
        },
      );
      return ResponseHelper.CreateResponse<SocialLoginVerifyUserResponseDTO>(
        Constants.OTP_SENT,
        {
          resetToken: token,
        },
        HttpStatus.OK,
      );
    }

    // If user not found by social ID, check if an account with this email already exists
    // This handles cases where a user might register with email/password, then try social login with the same email.
    // You might want to link accounts here, or prevent login if email already exists without social link.
    const result = await this.userRepository.validateUser(email, userType, {
      id: true,
      email: true,
      user_type: true,
      otp_verified: true,
    });

    if (result) {
      // User with this email exists, link the social ID only if it's not linked.
      if (!(result.googleId && result.facebookId)) {
        if (result.otp_verified) {
          const updatedUser = await this.userRepository.update(
            { id: result.id },
            { [socialIdField]: socialId },
            { id: true, email: true, user_type: true },
          );
          // User found, return it
          return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
            Constants.USER_ALREADY_VERIFIED,
            {
              id: Number(result.id),
              email: result.email,
              userType: result.user_type,
            },
            HttpStatus.OK,
          );
        }
        // User found, but not verified return it
        // TODO: Code optimization...
        // Send OTP to the user's email.
        const otpResponse = await this.generateOTPAndExpiry();
        console.log(`[Auth-Service][User-Email] user-email: ${result.email}`);
        const token = this.encryptionHelper.encrypt(result.email);
        console.log(`[Auth-Service][User-Email] token: ${token}`);
        this.sendOTPInEmail(
          email,
          { otp: otpResponse.plainOTP, resetToken: token },
          EmailTemplateType.OTP_VERIFICATION,
        );
        await this.userRepository.update(
          {
            email_user_type: {
              user_type: result.user_type,
              email: result.email,
            },
          },
          {
            otp: otpResponse.otp,
            otp_expires_at: otpResponse.otp_expiry_date_time,
          },
        );
        return ResponseHelper.CreateResponse<SocialLoginVerifyUserResponseDTO>(
          Constants.OTP_SENT,
          {
            resetToken: token,
          },
          HttpStatus.OK,
        );
      }
    }
    // No existing user found, create a new one
    // generating OTP as well which will needed
    // TODO: Will refactor later with actual create method of user service
    const otpResponse = await this.generateOTPAndExpiry();
    // Construct the data object for createUser
    const password = await bcrypt.hash(
      'SOCIAL_LOGIN_PASSWORD_PLACEH',
      this.SALT_ROUND,
    );
    const newUserCreateData: Prisma.UserCreateInput = {
      name: 'SOCIAL_LOGIN_USER_NAME',
      email: email,
      password: password,
      userType: {
        connect: {
          id: userType,
        },
      },
      otp: otpResponse.otp,
      otp_expires_at: otpResponse.otp_expiry_date_time,
    };

    // Conditionally add the social ID field to the data object.
    // Because Prisma doesn't allow dynamic column.
    if (provider === 'google') {
      newUserCreateData.googleId = socialId;
    } else if (provider === 'facebook') {
      newUserCreateData.facebookId = socialId;
    }

    const newUser = await this.userRepository.createUser(newUserCreateData);

    const token = this.encryptionHelper.encrypt(email);
    this.sendOTPInEmail(
      email,
      { otp: otpResponse.plainOTP, resetToken: token },
      EmailTemplateType.OTP_VERIFICATION,
    );
    return ResponseHelper.CreateResponse<SocialLoginVerifyUserResponseDTO>(
      Constants.USER_CREATED_SUCCESS,
      {
        resetToken: token,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Finds multiple users by their number IDs and returns their basic details.
   * This method is intended for internal service-to-service communication.
   * @param userIds An array of user IDs (number).
   * @returns A promise that resolves to an array of UserDetailsResponseDto.
   */
  async findUsersByIds(
    userIds: number[],
  ): Promise<ApiResponse<UserDetailsResponseDto[]>> {
    if (!userIds || userIds.length === 0) {
      return ResponseHelper.CreateResponse<UserDetailsResponseDto[]>(
        '',
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure unique IDs to avoid redundant queries
    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.userRepository.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        full_name: true,
      },
    });

    return ResponseHelper.CreateResponse<UserDetailsResponseDto[]>(
      Constants.DATA_RETRIEVED_SUCCESSFULLY,
      users.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        fullName: user.full_name || '',
        email: user.email,
      })),
      HttpStatus.OK,
    );
  }
  /**
   * Private helper function which actually returns the newly generated OTP and its expiry
   */

  private async generateOTPAndExpiry(): Promise<{
    otp: string;
    otp_expiry_date_time: Date;
    plainOTP: string;
  }> {
    const plainOTP = Utils.generateOtp();
    const OTP = await this.hashOtp(plainOTP);
    const expiryDuration =
      this.configService.get<number>('OTP_EXPIRY_DURATION') || 5;
    const otpExpiry = this.calculateOtpExpiry(Number(expiryDuration));
    return { otp: OTP, otp_expiry_date_time: otpExpiry, plainOTP };
  }

  /**
   * Generate a link content will be an OTP and inside the link we have binded the email address and usertype to identify user accordingly.
   * @param {toEmail} This will be an email to whom we are sending.
   * @param {data} This This is a dynamic object which contains data related to email template.
   * @param {emailType} This will define the type of email we are sending to consumer.
   * @return {Promise<boolean>} this will shows if email has been sent successfully or not.
   */

  private async sendOTPInEmail(
    toEmail: string,
    data: any,
    emailType: EmailTemplateType,
  ): Promise<boolean> {
    const result = await this.emailService.sendEmail(emailType, {
      to: toEmail,
      ...data,
    });
    if (result) {
      return true;
    }
    return false;
  }

  /**
   * Update the otp verified field inside the users table.
   * @param userId this is the userId field of the user which is going to update after verifying the OTP
   * @returns {Promise<boolean>} The truthness of update
   */
  private async verifyOTPUpdate(userId: bigint): Promise<{ id: bigint }> {
    const result = await this.userRepository.update(
      {
        id: userId,
      },
      {
        otp_verified: true,
      },
      {
        id: true,
      },
    );
    return result;
  }

  /**
   * Hashes a plain text OTP using bcrypt.
   * @param {string} otp - The plain text OTP.
   * @returns {Promise<string>} The hashed OTP.
   */
  private async hashOtp(otp: string): Promise<string> {
    const hashedOtp = await bcrypt.hash(otp, this.SALT_ROUND);
    return hashedOtp;
  }

  /**
   * Calculates the OTP expiry timestamp (current time + minutes).
   * @param {number} minutes - Number of minutes until the OTP expires.
   * @returns {Date} The expiry timestamp.
   */
  private calculateOtpExpiry(minutes: number): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  }
}
