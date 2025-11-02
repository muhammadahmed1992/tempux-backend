import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { LoggingModule } from '../common/logging';

/**
 * Payment module for Stripe integration
 * Provides payment processing, account management, and transfer capabilities
 */
@Module({
  imports: [LoggingModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
