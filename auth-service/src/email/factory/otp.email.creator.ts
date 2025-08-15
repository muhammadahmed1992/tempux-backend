import { ConfigService } from '@nestjs/config';
import { EmailCreator } from './email.creator';
import { EmailMessage } from './email.message.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpEmailCreator extends EmailCreator {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  public factoryMethod(data: {
    to: string;
    otp: string;
    resetToken: string;
  }): EmailMessage {
    const baseUrl = this.configService.get<string>('FRONTEND_URL');
    return {
      to: data.to,
      subject: 'Your One-Time Password (OTP) - Verify Your Account',
      body:
        `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>One-Time Password (OTP)</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <h1 style="color: #007bff; font-size: 24px; margin: 20px 0; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; display: inline-block;">${
            data.otp
          }</h1>
          <p>This OTP is valid for the next ${
            this.configService.get<number>('OTP_EXPIRY_DURATION') || 20
          } minutes. Please do not share it with anyone.</p>
          <p>Please click on this link <a href="` +
        baseUrl +
        `/verify-account/` +
        data.resetToken +
        `">Click Here</a></p>
          <p>In-case if above link is not working then copy and paste this url into your browser's new tab or window.</p>
          <p>${baseUrl}/verify-account/${data.resetToken}</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>Your Application Team</p>
        </div>
      `,
    };
  }
}
