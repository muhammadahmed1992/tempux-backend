import Stripe from 'stripe';
import { AppLoggerService } from '../common/logging';

/**
 * Stripe client configuration and initialization
 * Handles Stripe API key setup and provides configured Stripe instance
 */
export class StripeClient {
  private static instance: Stripe;
  private static logger: AppLoggerService;

  /**
   * Initialize Stripe client with API key from environment variables
   * @param logger - Logger service instance for Stripe operations
   * @returns Configured Stripe instance
   */
  static initialize(logger: AppLoggerService): Stripe {
    if (!this.instance) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeSecretKey) {
        logger.error({
          message: 'Stripe secret key not found in environment variables',
          context: {
            operation: 'stripe_initialization',
            error: 'Missing STRIPE_SECRET_KEY environment variable',
          },
        });
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }

      this.logger = logger;

      this.instance = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover', // Latest stable API version
        typescript: true,
        timeout: 30000, // 30 seconds timeout
        maxNetworkRetries: 3,
      });

      logger.info({
        message: 'Stripe client initialized successfully',
        context: {
          operation: 'stripe_initialization',
          apiVersion: '2024-12-18.acacia',
          timeout: 30000,
          maxNetworkRetries: 3,
        },
      });
    }

    return this.instance;
  }

  /**
   * Get the initialized Stripe instance
   * @returns Configured Stripe instance
   * @throws Error if Stripe client hasn't been initialized
   */
  static getInstance(): Stripe {
    if (!this.instance) {
      throw new Error(
        'Stripe client not initialized. Call StripeClient.initialize() first.',
      );
    }
    return this.instance;
  }

  /**
   * Get the logger instance for Stripe operations
   * @returns Logger service instance
   */
  static getLogger(): AppLoggerService {
    if (!this.logger) {
      throw new Error(
        'Stripe logger not initialized. Call StripeClient.initialize() first.',
      );
    }
    return this.logger;
  }

  /**
   * Log Stripe API request details
   * @param operation - The Stripe operation being performed
   * @param requestData - Request data being sent to Stripe
   * @param metadata - Additional metadata for logging
   */
  static logRequest(
    operation: string,
    requestData: any,
    metadata?: Record<string, any>,
  ): void {
    if (this.logger) {
      this.logger.info({
        message: `Stripe API request: ${operation}`,
        context: {
          operation: `stripe_${operation}`,
          stripeOperation: operation,
          requestData: this.sanitizeRequestData(requestData),
          ...metadata,
        },
      });
    }
  }

  /**
   * Log Stripe API response details
   * @param operation - The Stripe operation that was performed
   * @param responseData - Response data received from Stripe
   * @param metadata - Additional metadata for logging
   */
  static logResponse(
    operation: string,
    responseData: any,
    metadata?: Record<string, any>,
  ): void {
    if (this.logger) {
      this.logger.info({
        message: `Stripe API response: ${operation}`,
        context: {
          operation: `stripe_${operation}`,
          stripeOperation: operation,
          responseData: this.sanitizeResponseData(responseData),
          ...metadata,
        },
      });
    }
  }

  /**
   * Log Stripe API error details
   * @param operation - The Stripe operation that failed
   * @param error - Error received from Stripe
   * @param metadata - Additional metadata for logging
   */
  static logError(
    operation: string,
    error: any,
    metadata?: Record<string, any>,
  ): void {
    if (this.logger) {
      this.logger.error({
        message: `Stripe API error: ${operation}`,
        context: {
          operation: `stripe_${operation}`,
          stripeOperation: operation,
          error: {
            message: error.message,
            type: error.type,
            code: error.code,
            decline_code: error.decline_code,
            param: error.param,
            request_id: error.request_id,
          },
          ...metadata,
        },
        error,
      });
    }
  }

  /**
   * Sanitize request data to remove sensitive information
   * @param data - Request data to sanitize
   * @returns Sanitized request data
   */
  private static sanitizeRequestData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveKeys = ['number', 'cvc', 'exp_month', 'exp_year', 'card'];

    // Remove sensitive card information
    if (sanitized.card) {
      sanitized.card = '[REDACTED]';
    }

    // Remove other sensitive fields
    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize response data to remove sensitive information
   * @param data - Response data to sanitize
   * @returns Sanitized response data
   */
  private static sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove sensitive fields from response
    if (sanitized.card) {
      sanitized.card = '[REDACTED]';
    }

    if (sanitized.source) {
      sanitized.source = '[REDACTED]';
    }

    return sanitized;
  }
}
