import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { ConfigService } from "@nestjs/config";
import { EmailTemplateType } from "@EmailFactory/email.template.type";
import { EmailCreator } from "@EmailFactory/email.creator";
import Constants from "@Helper/constants";
import { OtpEmailCreator } from "@EmailFactory/otp.email.creator";
import { ResetPasswordEmailCreator } from "@EmailFactory/reset.password.creator";

@Injectable()
export class EmailService {
  private readonly isProduction = process.env.NODE_ENV === "production";
  private transporter: Mail;
  private mailFrom: string;
  private emailCreators: Map<EmailTemplateType, EmailCreator>;

  constructor(
    private configService: ConfigService,
    private readonly otpEmailCreation: OtpEmailCreator,
    private readonly resetPasswordEmailCreator: ResetPasswordEmailCreator
  ) {
    this.mailFrom = this.configService.get<string>("MAIL_FROM") || "";
    if (!this.mailFrom || !this.mailFrom.includes("@")) {
      console.error(
        'ERROR: MAIL_FROM environment variable is missing or invalid. Please set it in your .env file (e.g., MAIL_FROM="Your App Name <your_email@example.com>").'
      );
      throw new InternalServerErrorException(
        Constants.MAIL_FROM_MISSING_INVALID
      );
    }

    // Initialize the Nodemailer transporter with SMTP settings from environment variables
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("MAIL_HOST"),
      port: this.configService.get<number>("MAIL_PORT"),
      secure: this.configService.get<number>("MAIL_PORT") === 465, // Use 'true' if port is 465 (SSL/TLS)
      auth: {
        user: this.configService.get<string>("MAIL_USERNAME"),
        pass: this.configService.get<string>("MAIL_PASSWORD"),
      },
    });

    // Verify connection configuration (optional, but good for dev)
    if (!this.isProduction) {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Nodemailer transporter verification failed:", error);
        } else {
          console.log("Nodemailer transporter ready for messages.");
        }
      });
    }
    // Initialize the map with all concrete email creators
    this.emailCreators = new Map<EmailTemplateType, EmailCreator>();
    this.emailCreators.set(
      EmailTemplateType.OTP_VERIFICATION,
      this.otpEmailCreation
    );
    this.emailCreators.set(
      EmailTemplateType.PASSWORD_RESET,
      this.resetPasswordEmailCreator
    );
  }

  /**
   * Sends an email based on the specified template type and data.
   * @param type - The type of email template to use (from EmailTemplateType enum).
   * @param data - An object containing the necessary data for the specific template.
   * @returns {Promise<any>} A promise that resolves with the mailer response.
   */
  async sendEmail(type: EmailTemplateType, data: any): Promise<any> {
    const creator = this.emailCreators.get(type);
    if (!creator) {
      throw new InternalServerErrorException(
        `No email template creator found for type: ${type}.`
      );
    }

    // Use the factory method to create the specific email message
    const mailMessage = creator.factoryMethod(data);

    const mailOptions = {
      from: this.mailFrom,
      to: mailMessage.to,
      subject: mailMessage.subject,
      html: mailMessage.body,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email of type '${type}' sent: %s`, info.messageId);
      return info;
    } catch (error) {
      console.error(`Error sending email of type '${type}':`, error);
      throw new InternalServerErrorException(
        `Failed to send email of type '${type}'.`
      );
    }
  }
}
