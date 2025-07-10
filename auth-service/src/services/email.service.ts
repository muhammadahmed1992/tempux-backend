// auth-service/src/email/email.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer"; // Import nodemailer
import Mail from "nodemailer/lib/mailer"; // Import Mail for type hinting
import { ConfigService } from "@nestjs/config"; // For accessing environment variables

@Injectable()
export class EmailService {
  private transporter: Mail; // Nodemailer transporter instance
  private OTP_Expiry = -1;
  private applicationURL = "";
  constructor(private configService: ConfigService) {
    this.OTP_Expiry = this.configService.get<number>("OTP_EXPIRY_DURATION")!;
    this.applicationURL = this.configService.get<string>("FRONTEND_URL") || "";
    // Initialize the Nodemailer transporter with SMTP settings from environment variables
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("MAIL_HOST"),
      port: this.configService.get<number>("MAIL_PORT"),
      secure: this.configService.get<number>("MAIL_PORT") === 465, // Use 'true' if port is 465 (SSL/TLS)
      auth: {
        user: this.configService.get<string>("MAIL_USERNAME"),
        pass: this.configService.get<string>("MAIL_PASSWORD"),
      },
      // Optional: Add a logger for debugging nodemailer issues
      logger: true,
      debug: true,
    });

    // Verify connection configuration (optional, but good for dev)
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Nodemailer transporter verification failed:", error);
      } else {
        console.log("Nodemailer transporter ready for messages.");
      }
    });
  }

  /**
   * Sends an OTP email to the specified recipient.
   * @param to - The recipient's email address.
   * @param otp - The 6-digit OTP to send.
   * @returns {Promise<any>} A promise that resolves with the mailer response.
   */
  async sendOtpEmail(
    to: string,
    otp: string,
    email: string,
    usertype: number
  ): Promise<any> {
    const mailOptions = {
      from: this.configService.get<string>("MAIL_FROM"),
      to: to, // List of recipients
      subject: "Your One-Time Password (OTP)",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>One-Time Password (OTP)</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <h1 style="color: #007bff; font-size: 24px; margin: 20px 0; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; display: inline-block;">${otp}</h1>
          <p>This OTP is valid for the next ${this.OTP_Expiry} minutes. Please do not share it with anyone.</p>
          please click on this link or copy the url in your address browser ${this.applicationURL}
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>Your Application Team</p>
        </div>
      `, // HTML body
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
      // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only for Ethereal Email
      return info;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new InternalServerErrorException("Failed to send OTP email.");
    }
  }
}
