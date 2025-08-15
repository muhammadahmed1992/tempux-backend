import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { OtpEmailCreator } from './factory/otp.email.creator';
import { ResetPasswordEmailCreator } from './factory/reset.password.creator';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, OtpEmailCreator, ResetPasswordEmailCreator],
  exports: [EmailService],
})
export class EmailModule {}
