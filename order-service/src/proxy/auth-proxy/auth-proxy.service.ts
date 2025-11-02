import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { AxiosResponse } from 'axios';
import {
  ShippingAddressDto,
  BillingAddressDto,
} from '../../order/dtos/create-order.dto';

// Define interfaces for the address data
export interface AddressResponse {
  id: bigint;
  userId: bigint;
  addressType: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressesByContextResponse {
  shippingAddresses?: AddressResponse[];
  billingAddresses?: AddressResponse[];
  warehouseAddresses?: AddressResponse[];
  defaultShippingAddress?: AddressResponse;
  defaultBillingAddress?: AddressResponse;
  defaultWarehouseAddress?: AddressResponse;
}

export interface OrderAddressesResponse {
  shippingAddress: AddressResponse;
  warehouseAddress: AddressResponse;
}

@Injectable()
export class AuthProxyService {
  private readonly authSvcUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.authSvcUrl = this.configService.getOrThrow<string>('AUTH_SERVICE_URL');
    if (!this.authSvcUrl) {
      throw new InternalServerErrorException(
        'Auth Service URL not configured.',
      );
    }
  }

  /**
   * Creates a new address for a user
   */
  async createAddress(
    address: ShippingAddressDto | BillingAddressDto,
    userId: bigint,
    addressType: 'SHIPPING' | 'BILLING',
  ): Promise<bigint> {
    try {
      const createAddressDto = {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        countryCode: address.country,
        addressType: addressType,
        isDefault: false,
      };

      const response: AxiosResponse<{ data: AddressResponse }> =
        await firstValueFrom(
          this.httpService
            .post<{ data: AddressResponse }>(
              `${this.authSvcUrl}/user/addresses`,
              createAddressDto,
              {
                //Todo: make it dynamic currently hardcoding it
                headers: {
                  'x-user-id': userId.toString(),
                  'x-user-email': 'superadmin@mailinator.com',
                  'x-user-roles': '1',
                  // we might add an internal API key or mTLS for inter-service security here
                  // headers: { 'X-Internal-API-Key': 'your-secret-key' }
                },
              },
            )
            .pipe(
              catchError((error: AxiosError) => {
                if (error.response) {
                  // TODO: Implement Logging..
                }
                throw new InternalServerErrorException(
                  `Failed to create ${addressType.toLowerCase()} address in Auth Service.`,
                );
              }),
            ),
        );
      return response.data.data.id;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create ${addressType.toLowerCase()} address: ${
          error.message
        }`,
      );
    }
  }

  /**
   * Creates a new shipping address for a user
   */
  async createShippingAddress(
    shippingAddress: ShippingAddressDto,
    userId: bigint,
  ): Promise<bigint> {
    return this.createAddress(shippingAddress, userId, 'SHIPPING');
  }

  /**
   * Creates a new billing address for a user
   */
  async createBillingAddress(
    billingAddress: BillingAddressDto,
    userId: bigint,
  ): Promise<bigint> {
    return this.createAddress(billingAddress, userId, 'BILLING');
  }

  /**
   * Finds an address by ID and verifies user ownership
   */
  async findAddressById(
    addressId: bigint,
    userId: bigint,
  ): Promise<AddressResponse> {
    try {
      const response: AxiosResponse<{ data: AddressResponse }> =
        await firstValueFrom(
          this.httpService
            .get<{ data: AddressResponse }>(
              `${this.authSvcUrl}/user/addresses/${addressId.toString()}`,
              {
                headers: {
                  'x-user-id': userId.toString(),
                  'x-user-email': 'superadmin@mailinator.com',
                  'x-user-roles': '1',
                },
              },
            )
            .pipe(
              catchError((error: AxiosError) => {
                if (error.response) {
                  // TODO: Implement Logging..
                  console.error(
                    'Error response from auth service:',
                    error.response.data,
                  );
                }
                throw new InternalServerErrorException(
                  'Failed to find address in Auth Service.',
                );
              }),
            ),
        );

      return response.data.data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to find address: ${error.message}`,
      );
    }
  }

  /**
   * Validates if an address belongs to a user
   */
  async validateAddressOwnership(
    addressId: bigint,
    userId: bigint,
    expectedType?: string,
  ): Promise<boolean> {
    try {
      const validateDto = {
        addressId: Number(addressId),
        userId: Number(userId),
        expectedType,
      };

      const response: AxiosResponse<{ data: boolean }> = await firstValueFrom(
        this.httpService
          .post<{ data: boolean }>(
            `${this.authSvcUrl}/user/addresses/validate-ownership`,
            validateDto,
            {
              headers: {
                'x-user-id': userId.toString(),
                'x-user-email': 'superadmin@mailinator.com',
                'x-user-roles': '1',
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              if (error.response) {
                // TODO: Implement Logging..
              }
              throw new InternalServerErrorException(
                'Failed to validate address ownership in Auth Service.',
              );
            }),
          ),
      );

      return response.data.data;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Gets order addresses for buyer and seller
   */
  async getOrderAddresses(
    buyerId: bigint,
    sellerId: bigint,
  ): Promise<OrderAddressesResponse> {
    try {
      const response: AxiosResponse<{ data: OrderAddressesResponse }> =
        await firstValueFrom(
          this.httpService
            .post<{ data: OrderAddressesResponse }>(
              `${this.authSvcUrl}/user/addresses/order-addresses`,
              {
                buyerId: buyerId.toString(),
                sellerId: sellerId.toString(),
              },
              {
                headers: {
                  // You might add an internal API key or mTLS for inter-service security here
                  // headers: { 'X-Internal-API-Key': 'your-secret-key' }
                },
              },
            )
            .pipe(
              catchError((error: AxiosError) => {
                if (error.response) {
                  // TODO: Implement Logging..
                }
                throw new InternalServerErrorException(
                  'Failed to get order addresses from Auth Service.',
                );
              }),
            ),
        );

      return response.data.data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to get order addresses: ${error.message}`,
      );
    }
  }

  /**
   * Gets addresses by context (buyer/seller)
   */
  async findUserAddressesByContext(
    userId: bigint,
    context: 'buyer' | 'seller',
  ): Promise<AddressesByContextResponse> {
    try {
      const requestBody = { userId: userId.toString() };
      const response: AxiosResponse<{ data: AddressesByContextResponse }> =
        await firstValueFrom(
          this.httpService
            .post<{ data: AddressesByContextResponse }>(
              `${this.authSvcUrl}/user/addresses/context/${context}`,
              requestBody,
            )
            .pipe(
              catchError((error: AxiosError) => {
                throw new InternalServerErrorException(
                  'Failed to get user addresses by context from Auth Service.',
                );
              }),
            ),
        );

      return response.data.data;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get user addresses by context',
        context: {
          operation: 'get_user_addresses_by_context',
          error: error.message,
        },
      });
      throw new InternalServerErrorException(
        `Failed to get user addresses by context: ${error.message}`,
      );
    }
  }

  /**
   * Get user details including Stripe account information
   */
  async getUserDetails(userId: bigint): Promise<any> {
    try {
      const response: AxiosResponse<{ data: any }> = await firstValueFrom(
        this.httpService
          .get<{ data: any }>(`${this.authSvcUrl}/user/${userId.toString()}`, {
            headers: {
              'x-user-id': userId.toString(),
              'x-user-email': 'superadmin@mailinator.com',
              'x-user-roles': '1',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              throw new InternalServerErrorException(
                'Failed to get user details from Auth Service.',
              );
            }),
          ),
      );

      return response.data.data;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get user details',
        context: {
          operation: 'get_user_details',
          userId: userId.toString(),
          error: error.message,
        },
      });
      throw new InternalServerErrorException(
        `Failed to get user details: ${error.message}`,
      );
    }
  }

  /**
   * Update user's Stripe account ID
   */
  async updateUserStripeAccount(
    userId: bigint,
    stripeAccountId: string,
  ): Promise<any> {
    try {
      const requestBody = { stripeAccountId };
      const response: AxiosResponse<{ data: any }> = await firstValueFrom(
        this.httpService
          .patch<{ data: any }>(
            `${this.authSvcUrl}/user/${userId.toString()}/stripe-account`,
            requestBody,
            {
              headers: {
                'x-user-id': userId.toString(),
                'x-user-email': 'superadmin@mailinator.com',
                'x-user-roles': '1',
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              throw new InternalServerErrorException(
                'Failed to update user Stripe account from Auth Service.',
              );
            }),
          ),
      );

      return response.data.data;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update user Stripe account',
        context: {
          operation: 'update_user_stripe_account',
          userId: userId.toString(),
          stripeAccountId,
          error: error.message,
        },
      });
      throw new InternalServerErrorException(
        `Failed to update user Stripe account: ${error.message}`,
      );
    }
  }
}
