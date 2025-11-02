export class FedExContactDto {
  personName!: string;
  phoneNumber!: string;
  emailAddress!: string;
}

export class FedExShipmentAddressDto {
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  postalCode!: string;
  countryCode!: string;
}

export class FedExShipmentPackageDto {
  weight!: number;
  length!: number;
  width!: number;
  height!: number;
  customerReference!: string;
}

export class FedExShipmentRequestDto {
  shipperContact!: FedExContactDto;
  shipperAddress!: FedExShipmentAddressDto;
  recipientContact!: FedExContactDto;
  recipientAddress!: FedExShipmentAddressDto;
  packages!: FedExShipmentPackageDto[];
}

export class FedExShipmentResponseDto {
  transactionDetail?: {
    customerTransactionId?: string;
  };
  jobId?: string;
  output?: {
    transactionDetail?: {
      customerTransactionId?: string;
    };
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
    shipmentResults?: Array<{
      shipmentDocuments?: Array<{
        documentType?: string;
        documentReference?: string;
        documentContent?: string;
      }>;
      pieceResponses?: Array<{
        trackingNumber?: string;
        packageSequenceNumber?: number;
        packageDocuments?: Array<{
          documentType?: string;
          documentReference?: string;
          documentContent?: string;
        }>;
      }>;
    }>;
  };
}
