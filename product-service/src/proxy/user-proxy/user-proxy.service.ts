import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom, catchError } from "rxjs";
import { AxiosError } from "axios";

// Define a simple interface for the user data you expect from the User Service
export interface UserDetails {
  id: number;
  email: string;
  name: string;
  fullName: string;
}

@Injectable()
export class UserProxyService {
  private readonly userSvcUrl: string;
  // TODO: Need to implement logging...

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.userSvcUrl = this.configService.getOrThrow<string>("USER_SERVICE_URL");
    if (!this.userSvcUrl) {
      // TODO: Need to implement logging...
      throw new InternalServerErrorException(
        "User Service URL not configured."
      );
    }
  }

  /**
   * Fetches details for multiple users from the User Service.
   * Uses a POST request to handle potentially large lists of IDs.
   * @param userIds An array of user IDs (BigInt).
   * @returns A promise that resolves to an array of UserDetails.
   */
  async getUsersDetailsByIds(userIds: bigint[]): Promise<UserDetails[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const uniqueUserIds = [...new Set(userIds)]; // Ensure unique IDs

    const response = await firstValueFrom(
      this.httpService
        .post<UserDetails[]>(
          `${this.userSvcUrl}/users/details-by-ids`,
          { ids: uniqueUserIds.map((id) => id) }, // Convert BigInt to string for JSON payload
          {
            // You might add an internal API key or mTLS for inter-service security here
            // headers: { 'X-Internal-API-Key': 'your-secret-key' }
          }
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error.response) {
              // TODO: Implement Logging..
            }
            throw new InternalServerErrorException(
              "Failed to fetch user details from User Service."
            );
          })
        )
    );
    return response.data;
  }
}
