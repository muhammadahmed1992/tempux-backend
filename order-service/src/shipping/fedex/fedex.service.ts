import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { FedExOAuthResponseDto } from './dtos/fedex-oauth.dto';
import {
  FedExRateQuoteRequestDto,
  FedExRateQuoteResponseDto,
} from './dtos/fedex-rate-quote.dto';
import {
  FedExShipmentRequestDto,
  FedExShipmentResponseDto,
} from './dtos/fedex-shipment.dto';
import {
  FedExTrackingRequestDto,
  FedExTrackingResponseDto,
} from './dtos/fedex-tracking.dto';

@Injectable()
export class FedExService {
  private readonly logger = new Logger(FedExService.name);
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: this.configService.get<string>('FEDEX_API_BASE_URL'),
      timeout: 30000,
    });
  }

  /**
   * Todo: Willl create a utility builder for creating fedex request sections
   *
   */

  // 1. OAuth Token Management
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const oauthUrl = this.configService.get<string>('FEDEX_OAUTH_URL');
      if (!oauthUrl) throw new Error('FEDEX_OAUTH_URL is not configured');
      const clientId = this.configService.get<string>('FEDEX_CLIENT_ID') || '';
      const clientSecret =
        this.configService.get<string>('FEDEX_CLIENT_SECRET') || '';

      const response = await this.httpClient.post<FedExOAuthResponseDto>(
        oauthUrl,
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data as unknown as FedExOAuthResponseDto;
      this.accessToken = data.access_token;
      // Set token expiry (subtract 5 minutes for safety)
      this.tokenExpiry = new Date(
        Date.now() + ((data.expires_in || 3600) - 300) * 1000,
      );

      this.logger.log('FedEx OAuth token obtained successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to obtain FedEx OAuth token', error);
      throw new BadRequestException('Failed to authenticate with FedEx');
    }
  }

  // 2. Rate Quote API
  async getRateQuote(
    rateRequest: FedExRateQuoteRequestDto,
  ): Promise<FedExRateQuoteResponseDto> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.httpClient.post<FedExRateQuoteResponseDto>(
        '/rate/v1/rates/quotes',
        {
          accountNumber: {
            value: this.configService.get<string>('FEDEX_ACCOUNT_NUMBER'),
          },
          rateRequestControlParameters: {
            returnTransitTimes: true,
            servicesRequested: ['FEDEX_STANDARD'],
            variableOptions: 'FREIGHT_GUARANTEE',
          },
          requestedShipment: {
            shipper: {
              address: {
                streetLines: [rateRequest.shipperAddress.addressLine1],
                city: rateRequest.shipperAddress.city,
                stateOrProvinceCode: rateRequest.shipperAddress.state,
                postalCode: rateRequest.shipperAddress.postalCode,
                countryCode: rateRequest.shipperAddress.countryCode,
              },
            },
            recipient: {
              address: {
                streetLines: [rateRequest.recipientAddress.addressLine1],
                city: rateRequest.recipientAddress.city,
                stateOrProvinceCode: rateRequest.recipientAddress.state,
                postalCode: rateRequest.recipientAddress.postalCode,
                countryCode: rateRequest.recipientAddress.countryCode,
              },
            },
            pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
            rateRequestType: ['LIST'],
            requestedPackageLineItems: rateRequest.packages.map((pkg) => ({
              weight: {
                units: 'LB',
                value: pkg.weight,
              },
              dimensions: {
                length: pkg.length,
                width: pkg.width,
                height: pkg.height,
                units: 'IN',
              },
            })),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('FedEx rate quote obtained successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get FedEx rate quote', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          this.logger.error(
            'FedEx API Error Details:',
            axiosError.response.data,
          );
        }
      }
      throw new BadRequestException('Failed to get shipping rate quote');
    }
  }

  // 3. Shipment API
  async createShipment(
    shipmentRequest: FedExShipmentRequestDto,
  ): Promise<FedExShipmentResponseDto> {
    const accessToken = await this.getAccessToken();
    // Preparing request to send it
    const request = {
      accountNumber: {
        value: this.configService.get<string>('FEDEX_ACCOUNT_NUMBER'),
      },
      labelResponseOptions: 'LABEL',
      requestedShipment: {
        shipper: {
          contact: {
            personName: shipmentRequest.shipperContact.personName,
            phoneNumber: shipmentRequest.shipperContact.phoneNumber,
            emailAddress: shipmentRequest.shipperContact.emailAddress,
          },
          address: {
            streetLines: [shipmentRequest.shipperAddress.addressLine1],
            city: shipmentRequest.shipperAddress.city,
            stateOrProvinceCode: shipmentRequest.shipperAddress.state,
            postalCode: shipmentRequest.shipperAddress.postalCode,
            countryCode: shipmentRequest.shipperAddress.countryCode,
          },
        },
        recipients: [
          {
            contact: {
              personName: shipmentRequest.recipientContact.personName,
              phoneNumber: shipmentRequest.recipientContact.phoneNumber,
              emailAddress: shipmentRequest.recipientContact.emailAddress,
            },
            address: {
              streetLines: [shipmentRequest.recipientAddress.addressLine1],
              city: shipmentRequest.recipientAddress.city,
              stateOrProvinceCode: shipmentRequest.recipientAddress.state,
              postalCode: shipmentRequest.recipientAddress.postalCode,
              countryCode: shipmentRequest.recipientAddress.countryCode,
            },
          },
        ],
        shippingChargesPayment: {
          paymentType: 'SENDER',
          payor: {
            responsibleParty: {
              accountNumber: {
                value: this.configService.get<string>('FEDEX_ACCOUNT_NUMBER'),
              },
            },
          },
        },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: 'FEDEX_EXPRESS_SAVER', //  TODO: make this dynamic
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: shipmentRequest.packages.map((pkg) => ({
          weight: {
            units: 'LB',
            value: pkg.weight,
          },
          dimensions: {
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
            units: 'IN',
          },
          customerReferences: [
            {
              customerReferenceType: 'CUSTOMER_REFERENCE',
              value: pkg.customerReference,
            },
          ],
        })),
        labelSpecification: {
          imageType: 'PDF',
          labelStockType: 'PAPER_4X6',
        },
      },
    };
    try {
      const response = await this.httpClient.post<FedExShipmentResponseDto>(
        '/ship/v1/shipments',
        request,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('FedEx shipment created successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create FedEx shipment', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          this.logger.error(
            'FedEx API Error Details:',
            axiosError.response.data,
          );
        }
      }
      throw new BadRequestException('Failed to create shipment');
    }
  }

  // 4. Track API
  async trackShipment(
    trackingNumber: string,
  ): Promise<FedExTrackingResponseDto> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.httpClient.post<FedExTrackingResponseDto>(
        '/track/v1/trackingnumbers',
        {
          includeDetailedScans: true,
          trackingInfo: [
            {
              trackingNumberInfo: {
                trackingNumber: trackingNumber,
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('FedEx tracking information obtained successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get FedEx tracking information', error);
      throw new BadRequestException('Failed to get tracking information');
    }
  }
}
