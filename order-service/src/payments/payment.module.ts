import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { PaymentService } from './payment.service';
import { LoggingModule } from '../common/logging';
import { AuthProxyModule } from '../proxy/auth-proxy/auth-proxy.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Payment module for Stripe integration
 * Provides payment processing, account management, and transfer capabilities
 */
@Module({
  imports: [LoggingModule, AuthProxyModule, PrismaModule],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
