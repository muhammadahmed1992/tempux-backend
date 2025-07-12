// auth-service/src/email/email.module.ts
import { OtpEmailCreator } from "@EmailFactory/otp.email.creator";
import { ResetPasswordEmailCreator } from "@EmailFactory/reset.password.creator";
import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { EmailService } from "@Services/email.service";

@Module({
  imports: [ConfigModule],
  providers: [EmailService, OtpEmailCreator, ResetPasswordEmailCreator],
  exports: [EmailService, OtpEmailCreator, ResetPasswordEmailCreator],
})
export class EmailModule {}
