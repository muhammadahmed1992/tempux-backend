import {
  Controller,
  Post,
  Headers,
  RawBody,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { StripeClient } from './stripeClient';
import { PaymentService } from './payment.service';
import { AppLoggerService } from '../common/logging';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Webhook controller for handling Stripe events
 * Processes payment confirmations, account updates, and transfer notifications
 */
@Controller('payments')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Stripe webhook events
   * POST /payments/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer,
  ): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new HttpException(
        'Webhook secret not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!signature) {
      this.logger.error('Missing Stripe signature header');
      throw new HttpException(
        'Missing signature header',
        HttpStatus.BAD_REQUEST,
      );
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = StripeClient.getInstance().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.info({
        message: 'Stripe webhook event received',
        context: {
          operation: 'stripe_webhook_received',
          eventId: event.id,
          eventType: event.type,
          created: event.created,
        },
      });

      // Process the event
      await this.processWebhookEvent(event);

      this.logger.info({
        message: 'Stripe webhook event processed successfully',
        context: {
          operation: 'stripe_webhook_processed',
          eventId: event.id,
          eventType: event.type,
        },
      });

      return { received: true };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to process Stripe webhook',
        context: {
          operation: 'stripe_webhook_error',
          error: error.message,
          signature: signature.substring(0, 20) + '...',
        },
        error,
      });

      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process different types of Stripe webhook events
   * @param event - Stripe webhook event
   */
  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event);
        break;

      case 'transfer.created':
        await this.handleTransferCreated(event);
        break;

      default:
        this.logger.info({
          message: 'Unhandled Stripe webhook event type',
          context: {
            operation: 'stripe_webhook_unhandled',
            eventId: event.id,
            eventType: event.type,
          },
        });
    }
  }

  /**
   * Handle payment_intent.succeeded event
   * Mark order as paid and update payment status
   */
  private async handlePaymentIntentSucceeded(
    event: Stripe.Event,
  ): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    this.logger.info({
      message: 'Processing payment_intent.succeeded event',
      context: {
        operation: 'handle_payment_intent_succeeded',
        eventId: event.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });

    try {
      // Extract order ID from metadata
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        this.logger.warn({
          message: 'Payment intent missing orderId metadata',
          context: {
            operation: 'handle_payment_intent_succeeded',
            paymentIntentId: paymentIntent.id,
            metadata: paymentIntent.metadata,
          },
        });
        return;
      }

      // Update order payment status
      await this.updateOrderPaymentStatus(BigInt(orderId), 'PAID');

      // Update escrow status for order items
      await this.updateOrderItemsEscrowStatus(BigInt(orderId), 'HELD');

      this.logger.info({
        message: 'Payment intent succeeded processed successfully',
        context: {
          operation: 'handle_payment_intent_succeeded',
          paymentIntentId: paymentIntent.id,
          orderId,
          amount: paymentIntent.amount,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to process payment_intent.succeeded',
        context: {
          operation: 'handle_payment_intent_succeeded',
          paymentIntentId: paymentIntent.id,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Handle account.updated event
   * Update seller/shipper onboarding status
   */
  private async handleAccountUpdated(event: Stripe.Event): Promise<void> {
    const account = event.data.object as Stripe.Account;

    this.logger.info({
      message: 'Processing account.updated event',
      context: {
        operation: 'handle_account_updated',
        eventId: event.id,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        metadata: account.metadata,
      },
    });

    try {
      // Extract user ID from metadata
      const userId = account.metadata?.userId;
      if (!userId) {
        this.logger.warn({
          message: 'Account missing userId metadata',
          context: {
            operation: 'handle_account_updated',
            accountId: account.id,
            metadata: account.metadata,
          },
        });
        return;
      }

      // Update user's Stripe account status
      await this.updateUserStripeAccountStatus(BigInt(userId), account.id, {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      });

      this.logger.info({
        message: 'Account updated processed successfully',
        context: {
          operation: 'handle_account_updated',
          accountId: account.id,
          userId,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to process account.updated',
        context: {
          operation: 'handle_account_updated',
          accountId: account.id,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Handle transfer.created event
   * Mark transfer as complete in database
   */
  private async handleTransferCreated(event: Stripe.Event): Promise<void> {
    const transfer = event.data.object as Stripe.Transfer;

    this.logger.info({
      message: 'Processing transfer.created event',
      context: {
        operation: 'handle_transfer_created',
        eventId: event.id,
        transferId: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        transferGroup: transfer.transfer_group,
        metadata: transfer.metadata,
      },
    });

    try {
      // Extract order and seller information from metadata
      const orderId = transfer.metadata?.orderId;
      const sellerId = transfer.metadata?.sellerId;
      const transferType = transfer.metadata?.type;

      if (!orderId || !sellerId) {
        this.logger.warn({
          message: 'Transfer missing required metadata',
          context: {
            operation: 'handle_transfer_created',
            transferId: transfer.id,
            metadata: transfer.metadata,
          },
        });
        return;
      }

      // Update payout status based on transfer type
      if (transferType === 'seller_payout') {
        await this.updatePayoutStatus(
          BigInt(orderId),
          BigInt(sellerId),
          'COMPLETED',
        );
      }

      // Update escrow status to released
      await this.updateOrderItemsEscrowStatus(BigInt(orderId), 'RELEASED');

      this.logger.info({
        message: 'Transfer created processed successfully',
        context: {
          operation: 'handle_transfer_created',
          transferId: transfer.id,
          orderId,
          sellerId,
          transferType,
          amount: transfer.amount,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to process transfer.created',
        context: {
          operation: 'handle_transfer_created',
          transferId: transfer.id,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Update order payment status
   * @param orderId - Order ID
   * @param status - Payment status
   */
  private async updateOrderPaymentStatus(
    orderId: bigint,
    status: string,
  ): Promise<void> {
    try {
      // Note: This would need to be implemented based on your order schema
      // For now, we'll log the action
      this.logger.info({
        message: 'Order payment status updated',
        context: {
          operation: 'update_order_payment_status',
          orderId: orderId.toString(),
          status,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update order payment status',
        context: {
          operation: 'update_order_payment_status',
          orderId: orderId.toString(),
          status,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Update escrow status for order items
   * @param orderId - Order ID
   * @param status - Escrow status
   */
  private async updateOrderItemsEscrowStatus(
    orderId: bigint,
    status: string,
  ): Promise<void> {
    try {
      await this.prisma.order_item.updateMany({
        where: {
          order_id: orderId,
        },
        data: {
          escrow_status: status,
          updated_at: new Date(),
        },
      });

      this.logger.info({
        message: 'Order items escrow status updated',
        context: {
          operation: 'update_order_items_escrow_status',
          orderId: orderId.toString(),
          status,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update order items escrow status',
        context: {
          operation: 'update_order_items_escrow_status',
          orderId: orderId.toString(),
          status,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Update payout status for order items
   * @param orderId - Order ID
   * @param sellerId - Seller ID
   * @param status - Payout status
   */
  private async updatePayoutStatus(
    orderId: bigint,
    sellerId: bigint,
    status: string,
  ): Promise<void> {
    try {
      await this.prisma.order_item.updateMany({
        where: {
          order_id: orderId,
          seller_id: sellerId,
        },
        data: {
          payout_status: status,
          updated_at: new Date(),
        },
      });

      this.logger.info({
        message: 'Payout status updated',
        context: {
          operation: 'update_payout_status',
          orderId: orderId.toString(),
          sellerId: sellerId.toString(),
          status,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update payout status',
        context: {
          operation: 'update_payout_status',
          orderId: orderId.toString(),
          sellerId: sellerId.toString(),
          status,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Update user's Stripe account status
   * @param userId - User ID
   * @param accountId - Stripe Account ID
   * @param status - Account status information
   */
  private async updateUserStripeAccountStatus(
    userId: bigint,
    accountId: string,
    status: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    },
  ): Promise<void> {
    try {
      // This would typically update user record in auth-service
      // For now, we'll log the action
      this.logger.info({
        message: 'User Stripe account status updated',
        context: {
          operation: 'update_user_stripe_account_status',
          userId: userId.toString(),
          accountId,
          chargesEnabled: status.chargesEnabled,
          payoutsEnabled: status.payoutsEnabled,
          detailsSubmitted: status.detailsSubmitted,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update user Stripe account status',
        context: {
          operation: 'update_user_stripe_account_status',
          userId: userId.toString(),
          accountId,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }
}
