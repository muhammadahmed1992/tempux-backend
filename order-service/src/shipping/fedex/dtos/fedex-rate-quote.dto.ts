export class FedExAddressDto {
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  postalCode!: string;
  countryCode!: string;
}

export class FedExPackageDto {
  weight!: number;
  length!: number;
  width!: number;
  height!: number;
}

export class FedExRateQuoteRequestDto {
  shipperAddress!: FedExAddressDto;
  recipientAddress!: FedExAddressDto;
  packages!: FedExPackageDto[];
}

export class FedExRateQuoteResponseDto {
  transactionDetail?: {
    customerTransactionId?: string;
  };
  output?: {
    rateReplyDetails?: Array<{
      serviceType?: string;
      serviceName?: string;
      rateType?: string;
      ratedShipmentDetails?: Array<{
        totalNetFedExCharge?: number;
        totalNetCharge?: number;
        totalBaseCharge?: number;
        totalNetFreight?: number;
        totalSurcharges?: number;
        totalTaxes?: number;
        totalDutiesAndTaxes?: number;
        totalAncillaryFeesAndTaxes?: number;
        totalDutiesTaxesAndFees?: number;
        totalNetChargeWithDutiesAndTaxes?: number;
        shipmentRateDetail?: {
          rateType?: string;
          rateZone?: string;
          ratedWeightMethod?: string;
          totalBillingWeight?: {
            units?: string;
            value?: number;
          };
          totalDimWeight?: {
            units?: string;
            value?: number;
          };
          totalFreightDiscounts?: number;
          totalTaxes?: number;
          totalDutiesAndTaxes?: number;
          totalAncillaryFeesAndTaxes?: number;
          totalDutiesTaxesAndFees?: number;
          totalNetCharge?: number;
          totalNetFedExCharge?: number;
          totalSurcharges?: number;
          totalNetChargeWithDutiesAndTaxes?: number;
        };
      }>;
    }>;
  };
}
