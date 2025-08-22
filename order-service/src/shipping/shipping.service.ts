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

export interface RateQuoteRequest {
  shippingAddressId: bigint;
  orderItems: CreateOrderItemDto[];
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
  ) {}

  async getRateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse> {
    try {
      // Get shipping address details (this would be implemented based on your address storage)
      const shippingAddress = await this.getShippingAddress(
        request.shippingAddressId,
      );

      // Get shipper address (your warehouse/fulfillment center)
      const shipperAddress = this.getShipperAddress();

      // Calculate package dimensions and weight from order items
      const packages = await this.calculatePackages(request.orderItems);

      // Prepare FedEx rate quote request
      const fedExRateRequest: FedExRateQuoteRequestDto = {
        shipperAddress: {
          addressLine1: shipperAddress.addressLine1,
          city: shipperAddress.city,
          state: shipperAddress.state,
          postalCode: shipperAddress.postalCode,
          countryCode: shipperAddress.countryCode,
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

  private async getShippingAddress(addressId: bigint): Promise<any> {
    // This would fetch shipping address from our address storage
    // For now, returning a placeholder
    return {
      addressLine1: '123 Main St',
      city: 'Memphis',
      state: 'TN',
      postalCode: '38116',
      countryCode: 'US',
    };
  }

  private getShipperAddress(): any {
    // This would be your warehouse/fulfillment center address
    return {
      addressLine1: '456 Market Street',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      countryCode: 'US',
    };
  }

  private async calculatePackages(
    orderItems: CreateOrderItemDto[],
  ): Promise<any[]> {
    // This would calculate package dimensions and weight based on products
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
  ): Promise<void> {
    try {
      // Get shipping address for the order
      const shippingAddress = await this.getShippingAddress(BigInt(1)); // Placeholder
      const shipperAddress = this.getShipperAddress();

      // Prepare FedEx shipment request
      const fedExShipmentRequest: FedExShipmentRequestDto = {
        shipperContact: {
          personName: 'Warehouse Manager',
          phoneNumber: '555-123-4567',
          emailAddress: 'warehouse@company.com',
        },
        shipperAddress: {
          addressLine1: shipperAddress.addressLine1,
          city: shipperAddress.city,
          state: shipperAddress.state,
          postalCode: shipperAddress.postalCode,
          countryCode: shipperAddress.countryCode,
        },
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
