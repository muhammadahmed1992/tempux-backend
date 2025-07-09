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
      console.table(e);
      return ResponseHelper.CreateResponse<boolean>(
        Constants.ERROR_MESSAGE,
        false,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(request: LoginRequestDTO): Promise<ApiResponse<LoginDTO>> {
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
    const payload = {
      sub: Number(user.id),
      email: user.email,
      userType: user.user_type,
    };
    const token = await this.jwtService.signAsync(payload);
    return ResponseHelper.CreateResponse<LoginDTO>(
      Constants.USER_LOGGED_IN_SUCCESSFULLY,
      { accessToken: token },
      HttpStatus.ACCEPTED
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
