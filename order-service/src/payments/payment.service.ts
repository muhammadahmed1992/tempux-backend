import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeClient } from './stripeClient';
import { AppLoggerService } from '../common/logging';
import { AuthProxyService } from '../proxy/auth-proxy/auth-proxy.service';

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
}
