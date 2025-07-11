import { CreateUserDto } from "@DTO/create.user.dto";
import { LoginRequestDTO } from "@DTO/login-request.dto";
import { LoginDTO } from "@DTO/login.dto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRepository } from "@Repository/users.repository";
import ApiResponse from "@Helper/api-response";
import Constants from "@Helper/constants";
import ResponseHelper from "@Helper/response-helper";
import bcrypt from "bcrypt";
import { Utils } from "@Common/utils";
import { OTPVerificationRequestDTO } from "@DTO/otp.verification.dto";
import { EmailService } from "@Services/email.service";
import { ConfigService } from "@nestjs/config";
import { ResendOTPDTO } from "@DTO/resend.otp.dto";
import { SocialLoginResponseDTO } from "@DTO/social-login-response.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async create(user: CreateUserDto): Promise<ApiResponse<boolean>> {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const otpResponse = await this.generateOTPAndExpiry();
      const result = await this.userRepository.createUser(
        {
          name: user.username,
          email: user.email,
          password: hashedPassword,
          full_name: user.fullName,
          // TODO: Fix this long name sequence later.
          user_type_users_user_typeTouser_type: {
            connect: {
              id: user.userType,
            },
          },
          otp: otpResponse.otp,
          otp_expires_at: otpResponse.otp_expiry_date_time,
        },
        {
          id: true,
        }
      );
      this.sendOTPInEmail(user.email, otpResponse.plainOTP, user.userType);
      return ResponseHelper.CreateResponse<boolean>(
        Constants.USER_CREATED_SUCCESS,
        result.id ? true : false,
        HttpStatus.CREATED
      );
    } catch (e: unknown) {
      console.error(e);
      return ResponseHelper.CreateResponse<boolean>(
        Constants.ERROR_MESSAGE,
        false,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(
    request: LoginRequestDTO | SocialLoginResponseDTO
  ): Promise<ApiResponse<LoginDTO>> {
    const user = await this.userRepository.validateUser(
      request.email,
      request.userType
    );
    if (!user)
      return ResponseHelper.CreateResponse<LoginDTO>(
        Constants.USER_NOT_FOUND,
        { accessToken: "" },
        HttpStatus.NOT_FOUND
      );

    if (request instanceof LoginRequestDTO) {
      const isPasswordValid = await bcrypt.compare(
        request.password,
        user.password
      );

      if (!isPasswordValid)
        return ResponseHelper.CreateResponse<LoginDTO>(
          Constants.USER_NOT_FOUND,
          { accessToken: "" },
          HttpStatus.NOT_FOUND
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
      { accessToken: token },
      HttpStatus.OK
    );
  }

  async verifyOTP(
    request: OTPVerificationRequestDTO
  ): Promise<ApiResponse<boolean>> {
    const user = await this.userRepository.validateUser(
      request.email,
      request.userType
    );
    if (!user)
      return ResponseHelper.CreateResponse<boolean>(
        Constants.USER_NOT_FOUND,
        false,
        HttpStatus.NOT_FOUND
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
          HttpStatus.OK
        );
      } else {
        return ResponseHelper.CreateResponse<boolean>(
          Constants.EXPIRED_OTP,
          false,
          HttpStatus.EXPECTATION_FAILED
        );
      }
    } else {
      return ResponseHelper.CreateResponse<boolean>(
        Constants.INVALID_OTP,
        false,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async resendOTP(request: ResendOTPDTO): Promise<ApiResponse<boolean>> {
    const otpRes = await this.generateOTPAndExpiry();
    await this.sendOTPInEmail(request.email, otpRes.otp, request.userType);
    return ResponseHelper.CreateResponse<boolean>(
      Constants.OTP_RESEND,
      true,
      HttpStatus.ACCEPTED
    );
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
    provider: "google" | "facebook",
    socialId: string,
    email: string,
    userType: number
  ): Promise<ApiResponse<SocialLoginResponseDTO>> {
    const socialLoginFields = {
      google: "googleId",
      facebook: "facebookId",
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
      }
    );

    if (Array.isArray(user) && user?.length) {
      // User found, return it
      return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
        Constants.USER_ALREADY_EXISTS,
        {
          id: Number(user[0].id),
          email: user[0].email,
          userType: user[0].user_type,
        },
        HttpStatus.FOUND
      );
    }

    // If user not found by social ID, check if an account with this email already exists
    // This handles cases where a user might register with email/password, then try social login with the same email.
    // You might want to link accounts here, or prevent login if email already exists without social link.
    const result = await this.userRepository.validateUser(email, userType, {
      id: true,
      email: true,
      user_type: true,
    });

    if (result) {
      // User with this email exists, link the social ID only if it's not linked.
      if (!(result.googleId && result.facebookId)) {
        const updatedUser = await this.userRepository.update(
          { id: result.id },
          { [socialIdField]: socialId },
          { id: true, email: true, user_type: true }
        );
        // User found, return it
        return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
          Constants.USER_ALREADY_EXISTS,
          {
            id: Number(updatedUser.id),
            email: updatedUser.email,
            userType: updatedUser.user_type,
          },
          HttpStatus.FOUND
        );
      } else {
        // User found, return it
        return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
          Constants.USER_ALREADY_EXISTS,
          {
            id: Number(result.id),
            email: result.email,
            userType: result.user_type,
          },
          HttpStatus.FOUND
        );
      }
    }
    // No existing user found, create a new one
    // generating OTP as well which will needed
    // TODO: Will refactor later with actual create method of user service
    const otpResponse = await this.generateOTPAndExpiry();
    try {
      // Construct the data object for createUser
      const newUserCreateData: Prisma.usersCreateInput = {
        name: "SOCIAL_LOGIN_USER_NAME",
        email: email,
        password: "SOCIAL_LOGIN_PASSWORD_PLACEHOLDER",
        user_type_users_user_typeTouser_type: {
          connect: {
            id: userType,
          },
        },
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expiry_date_time,
      };

      // Conditionally add the social ID field to the data object.
      // Because Prisma doesn't allow dynamic column.
      if (provider === "google") {
        newUserCreateData.googleId = socialId;
      } else if (provider === "facebook") {
        newUserCreateData.facebookId = socialId;
      }

      const newUser = await this.userRepository.createUser(newUserCreateData);

      this.sendOTPInEmail(email, otpResponse.plainOTP, userType);
      return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
        Constants.USER_CREATED_SUCCESS,
        {
          id: Number(newUser.id),
          email: newUser.email,
          userType: newUser.user_type,
        },
        HttpStatus.CREATED
      );
    } catch (e) {
      console.log(e);
      return ResponseHelper.CreateResponse<SocialLoginResponseDTO>(
        Constants.USER_CREATED_ERROR,
        {} as any,
        HttpStatus.BAD_REQUEST
      );
    }
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
      this.configService.get<number>("OTP_EXPIRY_DURATION") || 5;
    const otpExpiry = this.calculateOtpExpiry(Number(expiryDuration));
    return { otp: OTP, otp_expiry_date_time: otpExpiry, plainOTP };
  }

  /**
   * Generate a link content will be an OTP and inside the link we have binded the email address and usertype to identify user accordingly.
   * @param {email} This will be a unique email of the user.
   * @param {userType} This will be a type value of user type field, which identifies its roles.
   * @return {Promise<boolean>} this will shows if email has been sent successfully or not.
   */

  private async sendOTPInEmail(
    email: string,
    otp: string,
    userType: number
  ): Promise<boolean> {
    try {
      const result = await this.emailService.sendOtpEmail(
        email,
        otp,
        email,
        userType
      );
      if (result) {
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e);
      // TODO: Need to remove all try/catch and use global exception handler
      return false;
    }
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
      }
    );
    return result;
  }

  /**
   * Hashes a plain text OTP using bcrypt.
   * @param {string} otp - The plain text OTP.
   * @returns {Promise<string>} The hashed OTP.
   */
  private async hashOtp(otp: string): Promise<string> {
    const saltRounds = 10; // Recommended salt rounds for bcrypt
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
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
