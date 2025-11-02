import { AddressResponseDto } from "@User/dtos/address.dto";

export default class AddressMapperHelper {
    /**
     * Maps a raw address entity to AddressResponseDto
     * @param address - Raw address data from database
     * @returns Formatted AddressResponseDto
     */
    static toAddressResponseDto(address: any): AddressResponseDto {
      return {
        id: address.id.toString(), // Convert BigInt to string
        userId: address.user_id.toString(), // Convert BigInt to string
        addressType: address.address_type.name,
        label: address.label,
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        countryCode: address.country_code,
        isDefault: address.is_default,
        isActive: address.is_active,
        createdAt: address.created_at,
        updatedAt: address.updated_at,
      };
    }

    /**
     * Maps an array of raw address entities to AddressResponseDto array
     * @param addresses - Array of raw address data from database
     * @returns Array of formatted AddressResponseDto
     */
    static toAddressResponseDtos(addresses: any[]): AddressResponseDto[] {
      return addresses.map(address => this.toAddressResponseDto(address));
    }

    /**
     * Maps a raw address entity to a simplified address format (for internal use)
     * @param address - Raw address data from database
     * @returns Simplified address object
     */
    static toSimpleAddress(address: any): {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
    } {
      return {
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        countryCode: address.country_code,
      };
    }

    /**
     * Validates if an address has all required fields for shipping
     * @param address - Address data to validate
     * @returns Boolean indicating if address is valid for shipping
     */
    static isValidShippingAddress(address: any): boolean {
      return !!(
        address?.address_line1 &&
        address?.city &&
        address?.state &&
        address?.postal_code &&
        address?.country_code
      );
    }
  }
