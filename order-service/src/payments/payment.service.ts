import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeClient } from './stripeClient';
import { AppLoggerService } from '../common/logging';
import { AuthProxyService } from '../proxy/auth-proxy/auth-proxy.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Payment service for handling Stripe operations
 * Provides methods for payment processing, escrow management, and account onboarding
 */
@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private logger: AppLoggerService;

  constructor(
    logger: AppLoggerService,
    private readonly authProxyService: AuthProxyService,
    private readonly prisma: PrismaService,
  ) {
    this.logger = logger;
    this.stripe = StripeClient.initialize(logger);
  }

  /**
   * Create a payment intent for order processing
   * @param amount - Amount in cents
   * @param currency - Currency code (default: 'usd')
   * @param metadata - Additional metadata
   * @returns Stripe PaymentIntent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    const operation = 'create_payment_intent';

    try {
      StripeClient.logRequest(operation, { amount, currency, metadata });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      StripeClient.logResponse(operation, paymentIntent);

      this.logger.info({
        message: 'Payment intent created successfully',
        context: {
          operation: 'create_payment_intent',
          paymentIntentId: paymentIntent.id,
          amount,
          currency,
          status: paymentIntent.status,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Confirm a payment intent
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @param paymentMethodId - Stripe PaymentMethod ID
   * @returns Confirmed PaymentIntent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentIntent> {
    const operation = 'confirm_payment_intent';

    try {
      StripeClient.logRequest(operation, { paymentIntentId, paymentMethodId });

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      StripeClient.logResponse(operation, paymentIntent);

      this.logger.info({
        message: 'Payment intent confirmed successfully',
        context: {
          operation: 'confirm_payment_intent',
          paymentIntentId,
          paymentMethodId,
          status: paymentIntent.status,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to confirm payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Create a connected account for sellers/shippers (Express account)
   * @param email - Seller/shipper email
   * @param country - Country code
   * @param metadata - Additional metadata
   * @returns Stripe Account
   */
  async createConnectedAccount(
    email: string,
    country: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Account> {
    const operation = 'create_connected_account';

    try {
      StripeClient.logRequest(operation, { email, country, metadata });

      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        metadata,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      StripeClient.logResponse(operation, account);

      this.logger.info({
        message: 'Connected account created successfully',
        context: {
          operation: 'create_connected_account',
          accountId: account.id,
          email,
          country,
          type: account.type,
        },
      });

      return account;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create connected account: ${error.message}`,
      );
    }
  }

  /**
   * Create account link for onboarding
   * @param accountId - Stripe Account ID
   * @param refreshUrl - URL to redirect to if link expires
   * @param returnUrl - URL to redirect to after onboarding
   * @returns Stripe AccountLink
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<Stripe.AccountLink> {
    const operation = 'create_account_link';

    try {
      StripeClient.logRequest(operation, { accountId, refreshUrl, returnUrl });

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      StripeClient.logResponse(operation, accountLink);

      this.logger.info({
        message: 'Account link created successfully',
        context: {
          operation: 'create_account_link',
          accountId,
          url: accountLink.url,
        },
      });

      return accountLink;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create account link: ${error.message}`,
      );
    }
  }

  /**
   * Create a transfer to connected account (for payouts)
   * @param amount - Amount in cents
   * @param destination - Connected account ID
   * @param currency - Currency code (default: 'usd')
   * @param metadata - Additional metadata
   * @returns Stripe Transfer
   */
  async createTransfer(
    amount: number,
    destination: string,
    currency: string = 'usd',
    metadata?: Record<string, string>,
  ): Promise<Stripe.Transfer> {
    const operation = 'create_transfer';

    try {
      StripeClient.logRequest(operation, {
        amount,
        destination,
        currency,
        metadata,
      });

      const transfer = await this.stripe.transfers.create({
        amount,
        currency,
        destination,
        metadata,
      });

      StripeClient.logResponse(operation, transfer);

      this.logger.info({
        message: 'Transfer created successfully',
        context: {
          operation: 'create_transfer',
          transferId: transfer.id,
          amount,
          destination,
          currency,
        },
      });

      return transfer;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create transfer: ${error.message}`,
      );
    }
  }

  /**
   * Create a payment intent with application fee (for escrow)
   * @param amount - Amount in cents
   * @param applicationFeeAmount - Application fee amount in cents
   * @param transferData - Transfer data for connected account
   * @param currency - Currency code (default: 'usd')
   * @param metadata - Additional metadata
   * @returns Stripe PaymentIntent
   */
  async createPaymentIntentWithEscrow(
    amount: number,
    applicationFeeAmount: number,
    transferData: { destination: string },
    currency: string = 'usd',
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    const operation = 'create_payment_intent_with_escrow';

    try {
      StripeClient.logRequest(operation, {
        amount,
        applicationFeeAmount,
        transferData,
        currency,
        metadata,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        application_fee_amount: applicationFeeAmount,
        transfer_data: transferData,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      StripeClient.logResponse(operation, paymentIntent);

      this.logger.info({
        message: 'Payment intent with escrow created successfully',
        context: {
          operation: 'create_payment_intent_with_escrow',
          paymentIntentId: paymentIntent.id,
          amount,
          applicationFeeAmount,
          destination: transferData.destination,
          currency,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create payment intent with escrow: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve a payment intent
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @returns Stripe PaymentIntent
   */
  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const operation = 'get_payment_intent';

    try {
      StripeClient.logRequest(operation, { paymentIntentId });

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );

      StripeClient.logResponse(operation, paymentIntent);

      this.logger.info({
        message: 'Payment intent retrieved successfully',
        context: {
          operation: 'get_payment_intent',
          paymentIntentId,
          status: paymentIntent.status,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to retrieve payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve a connected account
   * @param accountId - Stripe Account ID
   * @returns Stripe Account
   */
  async getConnectedAccount(accountId: string): Promise<Stripe.Account> {
    const operation = 'get_connected_account';

    try {
      StripeClient.logRequest(operation, { accountId });

      const account = await this.stripe.accounts.retrieve(accountId);

      StripeClient.logResponse(operation, account);

      this.logger.info({
        message: 'Connected account retrieved successfully',
        context: {
          operation: 'get_connected_account',
          accountId,
          type: account.type,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        },
      });

      return account;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to retrieve connected account: ${error.message}`,
      );
    }
  }

  /**
   * Cancel a payment intent
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @returns Cancelled PaymentIntent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const operation = 'cancel_payment_intent';

    try {
      StripeClient.logRequest(operation, { paymentIntentId });

      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId,
      );

      StripeClient.logResponse(operation, paymentIntent);

      this.logger.info({
        message: 'Payment intent cancelled successfully',
        context: {
          operation: 'cancel_payment_intent',
          paymentIntentId,
          status: paymentIntent.status,
        },
      });

      return paymentIntent;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to cancel payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Create an Express account for sellers/shippers
   * @param userId - User ID
   * @param role - User role ('seller' or 'shipper')
   * @param userEmail - User email address
   * @param country - Country code (default: 'US')
   * @returns Stripe Account
   */
  async createExpressAccount(
    userId: bigint,
    role: 'seller' | 'shipper',
    userEmail: string,
    country: string = 'US',
  ): Promise<Stripe.Account> {
    const operation = 'create_express_account';

    try {
      StripeClient.logRequest(operation, {
        userId: userId.toString(),
        role,
        userEmail,
        country,
      });

      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email: userEmail,
        metadata: {
          userId: userId.toString(),
          role,
          platform: 'tempux',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: role === 'seller' ? 'individual' : 'individual',
      });

      StripeClient.logResponse(operation, account);

      this.logger.info({
        message: 'Express account created successfully',
        context: {
          operation: 'create_express_account',
          userId: userId.toString(),
          role,
          accountId: account.id,
          email: userEmail,
          country,
        },
      });

      return account;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to create Express account: ${error.message}`,
      );
    }
  }

  /**
   * Generate onboarding link for Express account
   * @param accountId - Stripe Account ID
   * @param refreshUrl - URL to redirect to if link expires
   * @param returnUrl - URL to redirect to after onboarding
   * @returns Stripe AccountLink
   */
  async generateOnboardingLink(
    accountId: string,
    refreshUrl?: string,
    returnUrl?: string,
  ): Promise<Stripe.AccountLink> {
    const operation = 'generate_onboarding_link';

    try {
      // Use environment variables for URLs if not provided
      const defaultRefreshUrl =
        process.env.STRIPE_ONBOARDING_REFRESH_URL ||
        'http://localhost:3000/onboarding/refresh';
      const defaultReturnUrl =
        process.env.STRIPE_ONBOARDING_RETURN_URL ||
        'http://localhost:3000/onboarding/success';

      const finalRefreshUrl = refreshUrl || defaultRefreshUrl;
      const finalReturnUrl = returnUrl || defaultReturnUrl;

      StripeClient.logRequest(operation, {
        accountId,
        refreshUrl: finalRefreshUrl,
        returnUrl: finalReturnUrl,
      });

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: finalRefreshUrl,
        return_url: finalReturnUrl,
        type: 'account_onboarding',
      });

      StripeClient.logResponse(operation, accountLink);

      this.logger.info({
        message: 'Onboarding link generated successfully',
        context: {
          operation: 'generate_onboarding_link',
          accountId,
          url: accountLink.url,
          expiresAt: accountLink.expires_at,
        },
      });

      return accountLink;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      throw new BadRequestException(
        `Failed to generate onboarding link: ${error.message}`,
      );
    }
  }

  /**
   * Get user details from auth-service
   * @param userId - User ID
   * @returns User details including Stripe account info
   */
  async getUserDetails(userId: bigint): Promise<any> {
    const operation = 'get_user_details';

    try {
      this.logger.info({
        message: 'Getting user details from auth-service',
        context: {
          operation: 'get_user_details',
          userId: userId.toString(),
        },
      });

      const userDetails = await this.authProxyService.getUserDetails(userId);

      this.logger.info({
        message: 'User details retrieved successfully',
        context: {
          operation: 'get_user_details',
          userId: userId.toString(),
          hasStripeAccount: !!userDetails.stripeAccountId,
        },
      });

      return userDetails;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get user details',
        context: {
          operation: 'get_user_details',
          userId: userId.toString(),
          error: error.message,
        },
        error,
      });
      throw new BadRequestException(
        `Failed to get user details: ${error.message}`,
      );
    }
  }

  /**
   * Update user's Stripe account ID in auth-service
   * @param userId - User ID
   * @param stripeAccountId - Stripe Account ID
   * @returns Updated user details
   */
  async updateUserStripeAccount(
    userId: bigint,
    stripeAccountId: string,
  ): Promise<any> {
    const operation = 'update_user_stripe_account';

    try {
      this.logger.info({
        message: 'Updating user Stripe account ID',
        context: {
          operation: 'update_user_stripe_account',
          userId: userId.toString(),
          stripeAccountId,
        },
      });

      const updatedUser = await this.authProxyService.updateUserStripeAccount(
        userId,
        stripeAccountId,
      );

      this.logger.info({
        message: 'User Stripe account ID updated successfully',
        context: {
          operation: 'update_user_stripe_account',
          userId: userId.toString(),
          stripeAccountId,
        },
      });

      return updatedUser;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update user Stripe account ID',
        context: {
          operation: 'update_user_stripe_account',
          userId: userId.toString(),
          stripeAccountId,
          error: error.message,
        },
        error,
      });
      throw new BadRequestException(
        `Failed to update user Stripe account ID: ${error.message}`,
      );
    }
  }

  /**
   * Transfer funds from escrow to sellers and shippers after order delivery
   * @param transferData - Transfer details including order, seller, and shipper information
   * @returns Transfer results for all parties
   */
  async transferFunds(transferData: {
    orderId: bigint;
    sellerId: bigint;
    shipperId?: bigint;
    sellerAmount: number;
    shipperAmount?: number;
    currency?: string;
  }): Promise<{
    sellerTransfer?: Stripe.Transfer;
    shipperTransfer?: Stripe.Transfer;
    success: boolean;
    errors: string[];
  }> {
    const operation = 'transfer_funds';
    const results = {
      sellerTransfer: undefined as Stripe.Transfer | undefined,
      shipperTransfer: undefined as Stripe.Transfer | undefined,
      success: true,
      errors: [] as string[],
    };

    try {
      StripeClient.logRequest(operation, {
        orderId: transferData.orderId.toString(),
        sellerId: transferData.sellerId.toString(),
        shipperId: transferData.shipperId?.toString(),
        sellerAmount: transferData.sellerAmount,
        shipperAmount: transferData.shipperAmount,
        currency: transferData.currency,
      });

      // Get seller's Stripe account ID
      const sellerDetails = await this.getUserDetails(transferData.sellerId);
      if (!sellerDetails.stripeAccountId) {
        throw new BadRequestException(
          `Seller ${transferData.sellerId} does not have a Stripe account`,
        );
      }

      // Transfer to seller
      try {
        const sellerTransfer = await this.stripe.transfers.create({
          amount: transferData.sellerAmount,
          currency: transferData.currency || 'pkr',
          destination: sellerDetails.stripeAccountId,
          transfer_group: transferData.orderId.toString(),
          metadata: {
            orderId: transferData.orderId.toString(),
            sellerId: transferData.sellerId.toString(),
            type: 'seller_payout',
          },
        });

        results.sellerTransfer = sellerTransfer;

        this.logger.info({
          message: 'Seller transfer created successfully',
          context: {
            operation: 'transfer_funds',
            orderId: transferData.orderId.toString(),
            sellerId: transferData.sellerId.toString(),
            transferId: sellerTransfer.id,
            amount: transferData.sellerAmount,
          },
        });
      } catch (error: any) {
        const errorMsg = `Failed to transfer to seller: ${error.message}`;
        results.errors.push(errorMsg);
        this.logger.error({
          message: errorMsg,
          context: {
            operation: 'transfer_funds',
            orderId: transferData.orderId.toString(),
            sellerId: transferData.sellerId.toString(),
            error: error.message,
          },
          error,
        });
      }

      // Transfer to shipper if applicable
      if (transferData.shipperId && transferData.shipperAmount) {
        try {
          const shipperDetails = await this.getUserDetails(
            transferData.shipperId,
          );
          if (!shipperDetails.stripeAccountId) {
            throw new BadRequestException(
              `Shipper ${transferData.shipperId} does not have a Stripe account`,
            );
          }

          const shipperTransfer = await this.stripe.transfers.create({
            amount: transferData.shipperAmount,
            currency: transferData.currency || 'pkr',
            destination: shipperDetails.stripeAccountId,
            transfer_group: transferData.orderId.toString(),
            metadata: {
              orderId: transferData.orderId.toString(),
              shipperId: transferData.shipperId.toString(),
              type: 'shipper_payout',
            },
          });

          results.shipperTransfer = shipperTransfer;

          this.logger.info({
            message: 'Shipper transfer created successfully',
            context: {
              operation: 'transfer_funds',
              orderId: transferData.orderId.toString(),
              shipperId: transferData.shipperId.toString(),
              transferId: shipperTransfer.id,
              amount: transferData.shipperAmount,
            },
          });
        } catch (error: any) {
          const errorMsg = `Failed to transfer to shipper: ${error.message}`;
          results.errors.push(errorMsg);
          this.logger.error({
            message: errorMsg,
            context: {
              operation: 'transfer_funds',
              orderId: transferData.orderId.toString(),
              shipperId: transferData.shipperId.toString(),
              error: error.message,
            },
            error,
          });
        }
      }

      // Update payout status in database
      await this.updatePayoutStatus(
        transferData.orderId,
        transferData.sellerId,
        results.errors.length === 0 ? 'COMPLETED' : 'FAILED',
      );

      results.success = results.errors.length === 0;

      StripeClient.logResponse(operation, results);

      this.logger.info({
        message: 'Fund transfer process completed',
        context: {
          operation: 'transfer_funds',
          orderId: transferData.orderId.toString(),
          success: results.success,
          errors: results.errors,
          sellerTransferId: results.sellerTransfer?.id,
          shipperTransferId: results.shipperTransfer?.id,
        },
      });

      return results;
    } catch (error: any) {
      StripeClient.logError(operation, error);
      results.success = false;
      results.errors.push(`Transfer process failed: ${error.message}`);

      this.logger.error({
        message: 'Fund transfer process failed',
        context: {
          operation: 'transfer_funds',
          orderId: transferData.orderId.toString(),
          error: error.message,
        },
        error,
      });

      return results;
    }
  }

  /**
   * Update payout status for order items
   * @param orderId - Order ID
   * @param sellerId - Seller ID
   * @param status - New payout status
   */
  async updatePayoutStatus(
    orderId: bigint,
    sellerId: bigint,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RETRY',
  ): Promise<void> {
    const operation = 'update_payout_status';

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
        message: 'Payout status updated successfully',
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
      throw new BadRequestException(
        `Failed to update payout status: ${error.message}`,
      );
    }
  }

  /**
   * Get order details for transfer processing
   * @param orderId - Order ID
   * @returns Order details with items and seller information
   */
  async getOrderForTransfer(orderId: bigint): Promise<any> {
    const operation = 'get_order_for_transfer';

    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          order_items: {
            include: {
              payout_item_links: true,
            },
          },
        },
      });

      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      this.logger.info({
        message: 'Order details retrieved for transfer',
        context: {
          operation: 'get_order_for_transfer',
          orderId: orderId.toString(),
          orderStatus: order.order_status,
          itemCount: order.order_items.length,
        },
      });

      return order;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get order for transfer',
        context: {
          operation: 'get_order_for_transfer',
          orderId: orderId.toString(),
          error: error.message,
        },
        error,
      });
      throw new BadRequestException(
        `Failed to get order for transfer: ${error.message}`,
      );
    }
  }

  /**
   * Process transfers for all sellers in an order
   * @param orderId - Order ID
   * @param shipperId - Optional shipper ID
   * @param shipperAmount - Optional shipper amount
   * @returns Transfer results for all sellers
   */
  async processOrderTransfers(
    orderId: bigint,
    shipperId?: bigint,
    shipperAmount?: number,
  ): Promise<{
    transfers: Array<{
      sellerId: bigint;
      amount: number;
      transfer?: Stripe.Transfer;
      success: boolean;
      error?: string;
    }>;
    shipperTransfer?: Stripe.Transfer;
    overallSuccess: boolean;
  }> {
    const operation = 'process_order_transfers';

    try {
      const order = await this.getOrderForTransfer(orderId);

      if (order.order_status !== 'DELIVERED') {
        throw new BadRequestException(
          `Order ${orderId} is not in DELIVERED status. Current status: ${order.order_status}`,
        );
      }

      // Group order items by seller
      const sellerAmounts = new Map<bigint, number>();
      order.order_items.forEach((item: any) => {
        const currentAmount = sellerAmounts.get(item.seller_id) || 0;
        sellerAmounts.set(
          item.seller_id,
          currentAmount + Number(item.total_price),
        );
      });

      const transferResults = [];
      let overallSuccess = true;

      // Process transfers for each seller
      for (const [sellerId, amount] of sellerAmounts) {
        try {
          const transferResult = await this.transferFunds({
            orderId,
            sellerId,
            sellerAmount: Math.round(amount * 100), // Convert to cents
            currency: 'pkr',
          });

          transferResults.push({
            sellerId,
            amount,
            transfer: transferResult.sellerTransfer,
            success: transferResult.success,
            error: transferResult.errors.join(', '),
          });

          if (!transferResult.success) {
            overallSuccess = false;
          }
        } catch (error: any) {
          transferResults.push({
            sellerId,
            amount,
            success: false,
            error: error.message,
          });
          overallSuccess = false;
        }
      }

      // Process shipper transfer if applicable
      let shipperTransfer: Stripe.Transfer | undefined;
      if (shipperId && shipperAmount) {
        try {
          const shipperResult = await this.transferFunds({
            orderId,
            sellerId: shipperId, // Reuse the method for shipper
            sellerAmount: Math.round(shipperAmount * 100),
            currency: 'pkr',
          });

          shipperTransfer = shipperResult.sellerTransfer;
          if (!shipperResult.success) {
            overallSuccess = false;
          }
        } catch (error: any) {
          this.logger.error({
            message: 'Failed to process shipper transfer',
            context: {
              operation: 'process_order_transfers',
              orderId: orderId.toString(),
              shipperId: shipperId.toString(),
              error: error.message,
            },
            error,
          });
          overallSuccess = false;
        }
      }

      this.logger.info({
        message: 'Order transfers processed',
        context: {
          operation: 'process_order_transfers',
          orderId: orderId.toString(),
          overallSuccess,
          sellerCount: transferResults.length,
          shipperTransferId: shipperTransfer?.id,
        },
      });

      return {
        transfers: transferResults,
        shipperTransfer,
        overallSuccess,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to process order transfers',
        context: {
          operation: 'process_order_transfers',
          orderId: orderId.toString(),
          error: error.message,
        },
        error,
      });
      throw new BadRequestException(
        `Failed to process order transfers: ${error.message}`,
      );
    }
  }
}
