export class FedExTrackingRequestDto {
  trackingNumber!: string;
}

export class FedExTrackingResponseDto {
  transactionDetail?: {
    customerTransactionId?: string;
  };
  output?: {
    completeTrackResults?: Array<{
      trackingNumber?: string;
      trackResults?: Array<{
        trackingNumberInfo?: {
          trackingNumber?: string;
          carrierCode?: string;
          operatingCompany?: string;
        };
        additionalTrackingInfo?: {
          hasAssociatedShipments?: boolean;
          nickName?: string;
          packageIdentifiers?: Array<{
            type?: string;
            value?: string;
          }>;
          shipmentNotes?: string;
        };
        distanceToDestination?: {
          units?: string;
          value?: number;
        };
        consolidationDetail?: Array<{
          timeStamp?: string;
          consolidationID?: string;
          trackingId?: string;
          trackingNumber?: string;
        }>;
        meterNumber?: string;
        returnDetail?: {
          authorizationName?: string;
          reasonDetail?: Array<{
            description?: string;
            type?: string;
          }>;
        };
        serviceDetail?: {
          description?: string;
          shortDescription?: string;
          type?: string;
        };
        destinationLocation?: {
          locationId?: string;
          locationNumber?: number;
          locationContactAndAddress?: {
            contact?: {
              personName?: string;
              phoneNumber?: string;
              companyName?: string;
            };
            address?: {
              streetLines?: string[];
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
              countryName?: string;
              residential?: boolean;
            };
          };
        };
        latestStatusDetail?: {
          code?: string;
          derivedCode?: string;
          statusByLocale?: string;
          description?: string;
        };
        deliveryDetails?: {
          deliveryDate?: string;
          deliveryDay?: string;
          deliveryTime?: string;
          deliveryLocation?: string;
          deliveryLocationDescription?: string;
          deliverySignatureName?: string;
          signatureName?: string;
          signatureTitle?: string;
          signatureImage?: string;
          signatureReleaseAuthorized?: boolean;
          signatureReleaseAuthorizedBy?: string;
          signatureReleaseAuthorizedByTitle?: string;
          signatureReleaseAuthorizedByCompany?: string;
          signatureReleaseAuthorizedByPhone?: string;
          signatureReleaseAuthorizedByEmail?: string;
          signatureReleaseAuthorizedByFax?: string;
          signatureReleaseAuthorizedByDate?: string;
          signatureReleaseAuthorizedByTime?: string;
          signatureReleaseAuthorizedByLocation?: string;
          signatureReleaseAuthorizedByLocationDescription?: string;
          signatureReleaseAuthorizedByLocationType?: string;
          signatureReleaseAuthorizedByLocationId?: string;
          signatureReleaseAuthorizedByLocationNumber?: number;
          signatureReleaseAuthorizedByLocationContactAndAddress?: {
            contact?: {
              personName?: string;
              phoneNumber?: string;
              companyName?: string;
            };
            address?: {
              streetLines?: string[];
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
              countryName?: string;
              residential?: boolean;
            };
          };
        };
        scanEvents?: Array<{
          date?: string;
          time?: string;
          eventType?: string;
          eventDescription?: string;
          eventLocation?: string;
          eventLocationId?: string;
          eventLocationNumber?: number;
          eventLocationContactAndAddress?: {
            contact?: {
              personName?: string;
              phoneNumber?: string;
              companyName?: string;
            };
            address?: {
              streetLines?: string[];
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
              countryName?: string;
              residential?: boolean;
            };
          };
          derivedStatus?: string;
          derivedStatusCode?: string;
          exceptionDescription?: string;
          exceptionCode?: string;
          delayDetail?: {
            type?: string;
            subType?: string;
            status?: string;
            startTimestamp?: string;
            dateTime?: string;
            reason?: string;
            reasonDescription?: string;
            delayType?: string;
            delayScope?: string;
            delayLevel?: string;
            delayPoint?: string;
            commitDate?: string;
            commitTime?: string;
            locationId?: string;
            locationNumber?: number;
            locationContactAndAddress?: {
              contact?: {
                personName?: string;
                phoneNumber?: string;
                companyName?: string;
              };
              address?: {
                streetLines?: string[];
                city?: string;
                stateOrProvinceCode?: string;
                postalCode?: string;
                countryCode?: string;
                countryName?: string;
                residential?: boolean;
              };
            };
          };
        }>;
        availableImages?: Array<{
          size?: string;
          type?: string;
          url?: string;
        }>;
        deliveryAttempts?: Array<{
          sequenceNumber?: number;
          deliveryDate?: string;
          deliveryTime?: string;
          deliveryLocation?: string;
          deliveryLocationDescription?: string;
          deliverySignatureName?: string;
          signatureName?: string;
          signatureTitle?: string;
          signatureImage?: string;
          signatureReleaseAuthorized?: boolean;
          signatureReleaseAuthorizedBy?: string;
          signatureReleaseAuthorizedByTitle?: string;
          signatureReleaseAuthorizedByCompany?: string;
          signatureReleaseAuthorizedByPhone?: string;
          signatureReleaseAuthorizedByEmail?: string;
          signatureReleaseAuthorizedByFax?: string;
          signatureReleaseAuthorizedByDate?: string;
          signatureReleaseAuthorizedByTime?: string;
          signatureReleaseAuthorizedByLocation?: string;
          signatureReleaseAuthorizedByLocationDescription?: string;
          signatureReleaseAuthorizedByLocationType?: string;
          signatureReleaseAuthorizedByLocationId?: string;
          signatureReleaseAuthorizedByLocationNumber?: number;
          signatureReleaseAuthorizedByLocationContactAndAddress?: {
            contact?: {
              personName?: string;
              phoneNumber?: string;
              companyName?: string;
            };
            address?: {
              streetLines?: string[];
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
              countryName?: string;
              residential?: boolean;
            };
          };
        }>;
        shipperInformation?: {
          shipperNumber?: string;
          shipperContactAndAddress?: {
            contact?: {
              personName?: string;
              phoneNumber?: string;
              companyName?: string;
            };
            address?: {
              streetLines?: string[];
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
              countryName?: string;
              residential?: boolean;
            };
          };
        };
        lastUpdatedDetail?: {
          timeStamp?: string;
          derivedCode?: string;
          statusByLocale?: string;
          description?: string;
        };
        availableNotifications?: Array<{
          type?: string;
          emailDetail?: {
            emailAddress?: string;
            name?: string;
            company?: string;
            phoneNumber?: string;
            locale?: string;
          };
          notificationDetail?: {
            notificationType?: string;
            emailDetail?: {
              emailAddress?: string;
              name?: string;
              company?: string;
              phoneNumber?: string;
              locale?: string;
            };
            localization?: {
              languageCode?: string;
              localeCode?: string;
            };
          };
        }>;
      }>;
    }>;
  };
}
