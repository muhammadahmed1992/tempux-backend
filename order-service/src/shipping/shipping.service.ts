import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ShipmentRepository } from './shipment.repository';
import { FedExService } from './fedex/fedex.service';
import {
  FedExRateQuoteRequestDto,
  FedExRateQuoteResponseDto,
} from './fedex/dtos/fedex-rate-quote.dto';
import {
  FedExShipmentRequestDto,
  FedExShipmentResponseDto,
} from './fedex/dtos/fedex-shipment.dto';
import { CreateOrderItemDto } from '../order/dtos/create-order.dto';
import { order_item } from '@prisma/client';
import {
  AddressesByContextResponse,
  AddressResponse,
  AuthProxyService,
} from '@Proxy/auth-proxy/auth-proxy.service';

export interface RateQuoteRequest {
  shippingAddressId: bigint;
  orderItems: CreateOrderItemDto[];
  userId: bigint;
  sellerId: bigint;
}

export interface RateQuoteResponse {
  totalCost: number;
  serviceType: string;
  transitDays: number;
  rateDetails: any;
}

export interface ShipmentResponse {
  trackingNumber: string;
  labelUrl: string;
  cost: number;
  estimatedDelivery: string;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly shipmentRepository: ShipmentRepository,
    private readonly fedExService: FedExService,
    private readonly authProxyService: AuthProxyService,
  ) {}

  async getRateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse> {
    try {
      const shippingAddress = await this.getShippingAddress(
        request.shippingAddressId,
        request.userId,
      );

      const warehouseAddress = await this.getShipperAddress(request.sellerId);
      // Calculate package dimensions and weight from order items
      const packages = await this.calculatePackages(request.orderItems);

      // Prepare FedEx rate quote request
      const fedExRateRequest: FedExRateQuoteRequestDto = {
        shipperAddress: {
          addressLine1: warehouseAddress.addressLine1,
          city: warehouseAddress.city,
          state: warehouseAddress.state,
          postalCode: warehouseAddress.postalCode,
          countryCode: warehouseAddress.countryCode,
        },
        recipientAddress: {
          addressLine1: shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          countryCode: shippingAddress.countryCode,
        },
        packages,
      };

      // Get rate quote from FedEx
      const fedExResponse = await this.fedExService.getRateQuote(
        fedExRateRequest,
      );

      // Extract rate information
      const rateDetail =
        fedExResponse.output?.rateReplyDetails?.[0]?.ratedShipmentDetails?.[0];
      if (!rateDetail) {
        throw new BadRequestException('No rate information available');
      }

      return {
        totalCost: rateDetail.totalNetCharge || 0,
        serviceType: 'FEDEX_STANDARD',
        transitDays: 3, // This would come from FedEx response
        rateDetails: rateDetail,
      };
    } catch (error) {
      this.logger.error('Failed to get rate quote', error);
      throw new BadRequestException('Failed to get shipping rate quote');
    }
  }

  async createShipmentsForOrder(
    orderId: bigint,
    orderItems: order_item[],
    userId: bigint,
    addressId: bigint,
  ): Promise<void> {
    try {
      const fedExProvider = await this.shipmentRepository.getFedExProvider();
      if (!fedExProvider) {
        throw new BadRequestException('FedEx provider not configured');
      }

      // Group order items by seller for shipment creation
      const itemsBySeller = this.groupItemsBySeller(orderItems);

      for (const [sellerId, items] of itemsBySeller) {
        await this.createShipmentForSeller(
          orderId,
          sellerId,
          items,
          fedExProvider.id,
          userId,
          addressId,
        );
      }
    } catch (error) {
      this.logger.error('Failed to create shipments for order', error);
      throw new BadRequestException('Failed to create shipments');
    }
  }

  async getShipmentTracking(trackingNumber: string): Promise<any> {
    try {
      return await this.fedExService.trackShipment(trackingNumber);
    } catch (error) {
      this.logger.error('Failed to get shipment tracking', error);
      throw new BadRequestException('Failed to get tracking information');
    }
  }

  private async getShippingAddress(
    addressId: bigint,
    userId: bigint,
  ): Promise<any> {
    // Use proxy to get the shipping address from database
    try {
      const address = this.authProxyService.findAddressById(addressId, userId);
      return address;
    } catch (error) {
      this.logger.error('Failed to get shipping address', error);
      throw new BadRequestException('Failed to get shipping address');
    }
  }

  private async getShipperAddress(sellerId: bigint): Promise<AddressResponse> {
    try {
      const addressResponse =
        await this.authProxyService.findUserAddressesByContext(
          sellerId,
          'seller',
        );
      // default warehouse address first
      if (addressResponse.defaultWarehouseAddress) {
        return addressResponse.defaultWarehouseAddress;
      }

      // Fallback to first warehouse address
      const firstWarehouseAddress = addressResponse.warehouseAddresses?.[0];
      if (firstWarehouseAddress) {
        return firstWarehouseAddress;
      }

      throw new BadRequestException('No warehouse address found for seller');
    } catch (error) {
      throw new BadRequestException(
        'Failed to retrieve seller warehouse address',
      );
    }
  }

  private async calculatePackages(
    orderItems: CreateOrderItemDto[],
  ): Promise<any[]> {
    // Todo: would calculate package dimensions and weight based on products
    // For now, returning a simple package calculation
    const totalWeight = orderItems.reduce(
      (sum, item) => sum + item.quantity * 1,
      0,
    ); // 1 lb per item

    return [
      {
        weight: Math.max(totalWeight, 1), // Minimum 1 lb
        length: 12,
        width: 8,
        height: 6,
      },
    ];
  }

  private groupItemsBySeller(
    orderItems: order_item[],
  ): Map<bigint, order_item[]> {
    const itemsBySeller = new Map<bigint, order_item[]>();

    for (const item of orderItems) {
      const sellerItems = itemsBySeller.get(item.seller_id) || [];
      sellerItems.push(item);
      itemsBySeller.set(item.seller_id, sellerItems);
    }

    return itemsBySeller;
  }

  private async createShipmentForSeller(
    orderId: bigint,
    sellerId: bigint,
    orderItems: order_item[],
    fedExProviderId: bigint,
    userId: bigint,
    addressId: bigint,
  ): Promise<void> {
    try {
      // Get shipping address for the order
      const shippingAddress = await this.getShippingAddress(addressId, userId);
      const warehouseAddress = await this.getShipperAddress(sellerId);

      // Prepare FedEx shipment request
      const fedExShipmentRequest: FedExShipmentRequestDto = {
        // Todo: We'll implement to use the actual info
        shipperContact: {
          personName: 'Warehouse Manager',
          phoneNumber: '555-123-4567',
          emailAddress: 'warehouse@company.com',
        },
        shipperAddress: {
          addressLine1: warehouseAddress.addressLine1,
          city: warehouseAddress.city,
          state: warehouseAddress.state,
          postalCode: warehouseAddress.postalCode,
          countryCode: warehouseAddress.countryCode,
        },
        // Todo: We'll implement to use the actual info
        recipientContact: {
          personName: 'Customer',
          phoneNumber: '555-987-6543',
          emailAddress: 'customer@example.com',
        },
        recipientAddress: {
          addressLine1: shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          countryCode: shippingAddress.countryCode,
        },
        packages: orderItems.map((item, index) => ({
          weight: 1, // This would be calculated based on product weight
          length: 12,
          width: 8,
          height: 6,
          customerReference: `Order ${orderId} - Item ${index + 1}`,
        })),
      };

      // Create shipment with FedEx
      const fedExResponse = await this.fedExService.createShipment(
        fedExShipmentRequest,
      );
      // Extract tracking number and create shipment records
      const shipmentResult = fedExResponse.output?.shipmentResults?.[0];
      if (shipmentResult) {
        const pieceResponses = shipmentResult.pieceResponses || [];

        for (
          let i = 0;
          i < orderItems.length && i < pieceResponses.length;
          i++
        ) {
          const orderItem = orderItems[i];
          const pieceResponse = pieceResponses[i];

          await this.shipmentRepository.createShipmentForOrderItem(
            orderItem.id,
            {
              shipmentId: fedExProviderId,
              shipmentCost: 0, // This would be calculated from FedEx response
              trackingId: pieceResponse.trackingNumber || '',
              createdBy: orderItem.created_by,
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to create shipment for seller ${sellerId}`,
        error,
      );
      throw error;
    }
  }
}
