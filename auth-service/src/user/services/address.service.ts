import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
  AddressesByContextResponseDto,
} from '../dtos/address.dto';
import { Prisma } from '@prisma/client';
import AddressMapperHelper from '../helper/address-mapper.helper';
import { AppLoggerService } from '../../common/logging/logger.service';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService, private readonly logger: AppLoggerService) {}

  /**
   * Creates a new address for a user
   */
  async createAddress(
    userId: bigint,
    createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    try {
      // Get address type ID
      const addressType = await this.prisma.addressType.findFirst({
        where: { name: createAddressDto.addressType, is_deleted: false },
      });

      if (!addressType) {
        throw new NotFoundException(
          `Address type ${createAddressDto.addressType} not found`,
        );
      }

      // If this is set as default, unset other defaults of the same type
      if (createAddressDto.isDefault) {
        await this.prisma.address.updateMany({
          where: {
            user_id: userId,
            address_type_id: addressType.id,
            is_default: true,
            is_active: true,
            is_deleted: false,
          },
          data: { is_default: false },
        });
      }

      const address = await this.prisma.address.create({
        data: {
          user_id: userId,
          address_type_id: addressType.id,
          label: createAddressDto.label,
          address_line1: createAddressDto.addressLine1,
          address_line2: createAddressDto.addressLine2,
          city: createAddressDto.city,
          state: createAddressDto.state,
          postal_code: createAddressDto.postalCode,
          country_code: createAddressDto.countryCode,
          is_default: createAddressDto.isDefault || false,
          is_active: true,
          is_deleted: false,
        },
        include: {
          address_type: true,
        },
      });

      return AddressMapperHelper.toAddressResponseDto(address);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create address: ${error.message}`,
      );
    }
  }

  /**
   * Finds an address by ID and verifies user ownership
   */
  async findAddressById(
    addressId: bigint,
    userId: bigint,
  ): Promise<AddressResponseDto> {
    try {
      const address = await this.prisma.address.findFirst({
        where: {
          id: addressId,
          is_active: true,
          is_deleted: false,
        },
        include: {
          address_type: true,
        },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${addressId} not found`);
      }

      // Check if the address belongs to the requesting user
      if (address.user_id !== userId) {
        throw new ForbiddenException(
          `Access denied. Address ${addressId} does not belong to user ${userId}`,
        );
      }

      return AddressMapperHelper.toAddressResponseDto(address);
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to find address ${addressId}: ${error.message}`,
      );
    }
  }

  /**
   * Finds addresses based on user role context
   */
  async findUserAddressesByContext(
    userId: bigint,
    context: 'buyer' | 'seller',
  ): Promise<AddressesByContextResponseDto> {
    try {
      if (context === 'buyer') {
        // For buyers: find shipping and billing addresses
        const [shippingAddresses, billingAddresses] = await Promise.all([
          this.getAddressesByType(userId, 'SHIPPING'),
          this.getAddressesByType(userId, 'BILLING'),
        ]);

        return {
          shippingAddresses,
          billingAddresses,
          defaultShippingAddress:
            shippingAddresses.find((addr) => addr.isDefault) ||
            shippingAddresses[0],
          defaultBillingAddress:
            billingAddresses.find((addr) => addr.isDefault) ||
            billingAddresses[0],
        };
      } else {
        // For sellers: find warehouse addresses
        const warehouseAddresses = await this.getAddressesByType(
          userId,
          'WAREHOUSE',
        );
        return {
          warehouseAddresses,
          defaultWarehouseAddress:
            warehouseAddresses.find((addr) => addr.isDefault) ||
            warehouseAddresses[0],
        };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to find addresses for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Gets the default address for a specific user and address type
   */
  async getDefaultAddressByType(
    userId: bigint,
    addressType: string,
  ): Promise<AddressResponseDto | null> {
    try {
      const addressTypeRecord = await this.prisma.addressType.findFirst({
        where: { name: addressType, is_deleted: false },
      });

      if (!addressTypeRecord) {
        throw new NotFoundException(`Address type ${addressType} not found`);
      }

      let address = await this.prisma.address.findFirst({
        where: {
          user_id: userId,
          address_type_id: addressTypeRecord.id,
          is_active: true,
          is_deleted: false,
          is_default: true,
        },
        include: {
          address_type: true,
        },
      });

      // If no default found, get the first available address of that type
      if (!address) {
        address = await this.prisma.address.findFirst({
          where: {
            user_id: userId,
            address_type_id: addressTypeRecord.id,
            is_active: true,
            is_deleted: false,
          },
          include: {
            address_type: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
      }

      return address ? AddressMapperHelper.toAddressResponseDto(address) : null;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get default ${addressType} address for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Gets shipping address for buyer and warehouse address for seller
   */
  async getOrderAddresses(
    buyerId: bigint,
    sellerId: bigint,
  ): Promise<{
    shippingAddress: AddressResponseDto;
    warehouseAddress: AddressResponseDto;
  }> {
    try {
      const [shippingAddress, warehouseAddress] = await Promise.all([
        this.getDefaultAddressByType(buyerId, 'SHIPPING'),
        this.getDefaultAddressByType(sellerId, 'WAREHOUSE'),
      ]);

      if (!shippingAddress) {
        throw new NotFoundException(
          `No shipping address found for buyer ${buyerId}`,
        );
      }

      if (!warehouseAddress) {
        throw new NotFoundException(
          `No warehouse address found for seller ${sellerId}`,
        );
      }

      return {
        shippingAddress,
        warehouseAddress,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get order addresses: ${error.message}`,
      );
    }
  }

  /**
   * Validates if an address belongs to a user and is of the correct type
   */
  async validateAddressOwnership(
    addressId: bigint,
    userId: bigint,
    expectedType?: string,
  ): Promise<boolean> {
    try {
      this.logger.log({
        message: 'Validating address ownership',
        context: {
          operation: 'validate_address_ownership',
          addressId: addressId.toString(),
          userId: userId.toString(),
          expectedType: expectedType,
        },
      });
      const whereCondition: Prisma.AddressWhereInput = {
        id: addressId,
        user_id: userId,
        is_active: true,
        is_deleted: false,
      };

      if (expectedType) {
        const addressType = await this.prisma.addressType.findFirst({
          where: { name: expectedType, is_deleted: false },
        });
        if (addressType) {
          whereCondition.address_type_id = addressType.id;
        }
      }

      const address = await this.prisma.address.findFirst({
        where: whereCondition,
      });

      this.logger.log({
        message: 'Address found',
        context: {
          operation: 'validate_address_ownership',
          addressId: addressId.toString(),
        },
      });

      return !!address;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to validate address ownership',
        context: {
          operation: 'validate_address_ownership',
          error: error.message,
        },
      });
      return false;
    }
  }

  /**
   * Gets addresses by type for a user
   */
  private async getAddressesByType(
    userId: bigint,
    addressType: string,
  ): Promise<AddressResponseDto[]> {
    const addressTypeRecord = await this.prisma.addressType.findFirst({
      where: { name: addressType, is_deleted: false },
    });

    if (!addressTypeRecord) {
      throw new NotFoundException(
        `No ${addressType} address type record found `,
      );
    }

    const addresses = await this.prisma.address.findMany({
      where: {
        user_id: userId,
        address_type_id: addressTypeRecord.id,
        is_active: true,
        is_deleted: false,
      },
      include: {
        address_type: true,
      },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    if (addresses.length === 0) {
      throw new NotFoundException(`No address record found for user `);
    }

    return addresses.map((address) =>
      AddressMapperHelper.toAddressResponseDto(address),
    );
  }
}
