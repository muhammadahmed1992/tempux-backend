import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AppLoggerService } from '../common/logging';
import ApiResponse from '../common/helper/api-response';
import ResponseHelper from '../common/helper/response-helper';
import { HeaderAuthGuard } from '../auth/guards/auth-user-guard';
import { UserId } from '../auth/decorators/userId.decorator';

// DTOs for payment operations
interface CreatePaymentIntentDto {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface ConfirmPaymentIntentDto {
  paymentIntentId: string;
  paymentMethodId: string;
}

interface CreateConnectedAccountDto {
  email: string;
  country: string;
  metadata?: Record<string, string>;
}

interface CreateAccountLinkDto {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

interface CreateTransferDto {
  amount: number;
  destination: string;
  currency?: string;
  metadata?: Record<string, string>;
}

interface CreateEscrowPaymentDto {
  amount: number;
  applicationFeeAmount: number;
  transferData: { destination: string };
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment controller for handling Stripe payment operations
 * Provides endpoints for payment processing, account management, and transfers
 */
@Controller('payments')
@UseGuards(HeaderAuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Create a payment intent
   * POST /payments/intent
   */
  @Post('intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Creating payment intent',
      context: {
        operation: 'create_payment_intent',
        userId: userId.toString(),
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency,
      },
    });

    const paymentIntent = await this.paymentService.createPaymentIntent(
      createPaymentIntentDto.amount,
      createPaymentIntentDto.currency,
      {
        ...createPaymentIntentDto.metadata,
        userId: userId.toString(),
      },
    );

    this.logger.info({
      message: 'Payment intent created successfully',
      context: {
        operation: 'create_payment_intent',
        userId: userId.toString(),
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      },
    });

    return ResponseHelper.CreateResponse(
      'Payment intent created successfully',
      {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Confirm a payment intent
   * POST /payments/intent/:id/confirm
   */
  @Post('intent/:id/confirm')
  async confirmPaymentIntent(
    @Param('id') paymentIntentId: string,
    @Body() confirmPaymentIntentDto: ConfirmPaymentIntentDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Confirming payment intent',
      context: {
        operation: 'confirm_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
        paymentMethodId: confirmPaymentIntentDto.paymentMethodId,
      },
    });

    const paymentIntent = await this.paymentService.confirmPaymentIntent(
      paymentIntentId,
      confirmPaymentIntentDto.paymentMethodId,
    );

    this.logger.info({
      message: 'Payment intent confirmed successfully',
      context: {
        operation: 'confirm_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
        status: paymentIntent.status,
      },
    });

    return ResponseHelper.CreateResponse(
      'Payment intent confirmed successfully',
      {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      HttpStatus.OK,
    );
  }

  /**
   * Get payment intent details
   * GET /payments/intent/:id
   */
  @Get('intent/:id')
  async getPaymentIntent(
    @Param('id') paymentIntentId: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Retrieving payment intent',
      context: {
        operation: 'get_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
      },
    });

    const paymentIntent = await this.paymentService.getPaymentIntent(
      paymentIntentId,
    );

    this.logger.info({
      message: 'Payment intent retrieved successfully',
      context: {
        operation: 'get_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
        status: paymentIntent.status,
      },
    });

    return ResponseHelper.CreateResponse(
      'Payment intent retrieved successfully',
      {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
      },
      HttpStatus.OK,
    );
  }

  /**
   * Cancel a payment intent
   * PUT /payments/intent/:id/cancel
   */
  @Put('intent/:id/cancel')
  async cancelPaymentIntent(
    @Param('id') paymentIntentId: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Cancelling payment intent',
      context: {
        operation: 'cancel_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
      },
    });

    const paymentIntent = await this.paymentService.cancelPaymentIntent(
      paymentIntentId,
    );

    this.logger.info({
      message: 'Payment intent cancelled successfully',
      context: {
        operation: 'cancel_payment_intent',
        userId: userId.toString(),
        paymentIntentId,
        status: paymentIntent.status,
      },
    });

    return ResponseHelper.CreateResponse(
      'Payment intent cancelled successfully',
      {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
      HttpStatus.OK,
    );
  }

  /**
   * Create a connected account for sellers/shippers
   * POST /payments/accounts
   */
  @Post('accounts')
  async createConnectedAccount(
    @Body() createConnectedAccountDto: CreateConnectedAccountDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Creating connected account',
      context: {
        operation: 'create_connected_account',
        userId: userId.toString(),
        email: createConnectedAccountDto.email,
        country: createConnectedAccountDto.country,
      },
    });

    const account = await this.paymentService.createConnectedAccount(
      createConnectedAccountDto.email,
      createConnectedAccountDto.country,
      {
        ...createConnectedAccountDto.metadata,
        userId: userId.toString(),
      },
    );

    this.logger.info({
      message: 'Connected account created successfully',
      context: {
        operation: 'create_connected_account',
        userId: userId.toString(),
        accountId: account.id,
        type: account.type,
      },
    });

    return ResponseHelper.CreateResponse(
      'Connected account created successfully',
      {
        id: account.id,
        type: account.type,
        country: account.country,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Create account link for onboarding
   * POST /payments/accounts/:id/onboard
   */
  @Post('accounts/:id/onboard')
  async createAccountLink(
    @Param('id') accountId: string,
    @Body() createAccountLinkDto: CreateAccountLinkDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Creating account link for onboarding',
      context: {
        operation: 'create_account_link',
        userId: userId.toString(),
        accountId,
        refreshUrl: createAccountLinkDto.refreshUrl,
        returnUrl: createAccountLinkDto.returnUrl,
      },
    });

    const accountLink = await this.paymentService.createAccountLink(
      accountId,
      createAccountLinkDto.refreshUrl,
      createAccountLinkDto.returnUrl,
    );

    this.logger.info({
      message: 'Account link created successfully',
      context: {
        operation: 'create_account_link',
        userId: userId.toString(),
        accountId,
        url: accountLink.url,
      },
    });

    return ResponseHelper.CreateResponse(
      'Account link created successfully',
      {
        url: accountLink.url,
        expires_at: accountLink.expires_at,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Get connected account details
   * GET /payments/accounts/:id
   */
  @Get('accounts/:id')
  async getConnectedAccount(
    @Param('id') accountId: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Retrieving connected account',
      context: {
        operation: 'get_connected_account',
        userId: userId.toString(),
        accountId,
      },
    });

    const account = await this.paymentService.getConnectedAccount(accountId);

    this.logger.info({
      message: 'Connected account retrieved successfully',
      context: {
        operation: 'get_connected_account',
        userId: userId.toString(),
        accountId,
        type: account.type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
    });

    return ResponseHelper.CreateResponse(
      'Connected account retrieved successfully',
      {
        id: account.id,
        type: account.type,
        country: account.country,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
      HttpStatus.OK,
    );
  }

  /**
   * Create a transfer to connected account
   * POST /payments/transfers
   */
  @Post('transfers')
  async createTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Creating transfer',
      context: {
        operation: 'create_transfer',
        userId: userId.toString(),
        amount: createTransferDto.amount,
        destination: createTransferDto.destination,
        currency: createTransferDto.currency,
      },
    });

    const transfer = await this.paymentService.createTransfer(
      createTransferDto.amount,
      createTransferDto.destination,
      createTransferDto.currency,
      {
        ...createTransferDto.metadata,
        userId: userId.toString(),
      },
    );

    this.logger.info({
      message: 'Transfer created successfully',
      context: {
        operation: 'create_transfer',
        userId: userId.toString(),
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
      },
    });

    return ResponseHelper.CreateResponse(
      'Transfer created successfully',
      {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Create a payment intent with escrow (application fee)
   * POST /payments/escrow
   */
  @Post('escrow')
  async createEscrowPayment(
    @Body() createEscrowPaymentDto: CreateEscrowPaymentDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Creating escrow payment',
      context: {
        operation: 'create_escrow_payment',
        userId: userId.toString(),
        amount: createEscrowPaymentDto.amount,
        applicationFeeAmount: createEscrowPaymentDto.applicationFeeAmount,
        destination: createEscrowPaymentDto.transferData.destination,
      },
    });

    const paymentIntent =
      await this.paymentService.createPaymentIntentWithEscrow(
        createEscrowPaymentDto.amount,
        createEscrowPaymentDto.applicationFeeAmount,
        createEscrowPaymentDto.transferData,
        createEscrowPaymentDto.currency,
        {
          ...createEscrowPaymentDto.metadata,
          userId: userId.toString(),
        },
      );

    this.logger.info({
      message: 'Escrow payment created successfully',
      context: {
        operation: 'create_escrow_payment',
        userId: userId.toString(),
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        applicationFeeAmount: paymentIntent.application_fee_amount,
      },
    });

    return ResponseHelper.CreateResponse(
      'Escrow payment created successfully',
      {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        applicationFeeAmount: paymentIntent.application_fee_amount,
      },
      HttpStatus.CREATED,
    );
  }

  /**
   * Onboard seller with Express account
   * POST /payments/onboard-seller
   */
  @Post('onboard-seller')
  async onboardSeller(@UserId() userId: bigint): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Starting seller onboarding process',
      context: {
        operation: 'onboard_seller',
        userId: userId.toString(),
      },
    });

    try {
      // Get user details to check if they already have a Stripe account
      const userDetails = await this.paymentService.getUserDetails(userId);

      let stripeAccountId = userDetails.stripeAccountId;

      // If user doesn't have a Stripe account, create one
      if (!stripeAccountId) {
        this.logger.info({
          message: 'Creating new Express account for seller',
          context: {
            operation: 'onboard_seller',
            userId: userId.toString(),
            email: userDetails.email,
          },
        });

        const account = await this.paymentService.createExpressAccount(
          userId,
          'seller',
          userDetails.email,
          userDetails.country || 'US',
        );

        stripeAccountId = account.id;

        // Update user record with Stripe account ID
        await this.paymentService.updateUserStripeAccount(
          userId,
          stripeAccountId,
        );

        this.logger.info({
          message: 'Express account created and linked to user',
          context: {
            operation: 'onboard_seller',
            userId: userId.toString(),
            stripeAccountId,
          },
        });
      } else {
        this.logger.info({
          message:
            'User already has Stripe account, generating new onboarding link',
          context: {
            operation: 'onboard_seller',
            userId: userId.toString(),
            stripeAccountId,
          },
        });
      }

      // Generate onboarding link
      const accountLink = await this.paymentService.generateOnboardingLink(
        stripeAccountId,
      );

      this.logger.info({
        message: 'Seller onboarding link generated successfully',
        context: {
          operation: 'onboard_seller',
          userId: userId.toString(),
          stripeAccountId,
          onboardingUrl: accountLink.url,
        },
      });

      return ResponseHelper.CreateResponse(
        'Seller onboarding link generated successfully',
        {
          stripeAccountId,
          onboardingUrl: accountLink.url,
          expiresAt: accountLink.expires_at,
        },
        HttpStatus.CREATED,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to onboard seller',
        context: {
          operation: 'onboard_seller',
          userId: userId.toString(),
          error: error.message,
        },
        error,
      });

      throw error;
    }
  }

  /**
   * Onboard shipper with Express account
   * POST /payments/onboard-shipper
   */
  @Post('onboard-shipper')
  async onboardShipper(@UserId() userId: bigint): Promise<ApiResponse<any>> {
    this.logger.info({
      message: 'Starting shipper onboarding process',
      context: {
        operation: 'onboard_shipper',
        userId: userId.toString(),
      },
    });

    try {
      // Get user details to check if they already have a Stripe account
      const userDetails = await this.paymentService.getUserDetails(userId);

      let stripeAccountId = userDetails.stripeAccountId;

      // If user doesn't have a Stripe account, create one
      if (!stripeAccountId) {
        this.logger.info({
          message: 'Creating new Express account for shipper',
          context: {
            operation: 'onboard_shipper',
            userId: userId.toString(),
            email: userDetails.email,
          },
        });

        const account = await this.paymentService.createExpressAccount(
          userId,
          'shipper',
          userDetails.email,
          userDetails.country || 'US',
        );

        stripeAccountId = account.id;

        // Update user record with Stripe account ID
        await this.paymentService.updateUserStripeAccount(
          userId,
          stripeAccountId,
        );

        this.logger.info({
          message: 'Express account created and linked to user',
          context: {
            operation: 'onboard_shipper',
            userId: userId.toString(),
            stripeAccountId,
          },
        });
      } else {
        this.logger.info({
          message:
            'User already has Stripe account, generating new onboarding link',
          context: {
            operation: 'onboard_shipper',
            userId: userId.toString(),
            stripeAccountId,
          },
        });
      }

      // Generate onboarding link
      const accountLink = await this.paymentService.generateOnboardingLink(
        stripeAccountId,
      );

      this.logger.info({
        message: 'Shipper onboarding link generated successfully',
        context: {
          operation: 'onboard_shipper',
          userId: userId.toString(),
          stripeAccountId,
          onboardingUrl: accountLink.url,
        },
      });

      return ResponseHelper.CreateResponse(
        'Shipper onboarding link generated successfully',
        {
          stripeAccountId,
          onboardingUrl: accountLink.url,
          expiresAt: accountLink.expires_at,
        },
        HttpStatus.CREATED,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to onboard shipper',
        context: {
          operation: 'onboard_shipper',
          userId: userId.toString(),
          error: error.message,
        },
        error,
      });

      throw error;
    }
  }
}
