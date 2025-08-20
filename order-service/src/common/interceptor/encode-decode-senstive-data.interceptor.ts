// --- File: src/common/interceptors/hashids.interceptor.ts ---
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HashidsService } from '@HashIds/hashids.service';

/**
 * A generic interceptor to handle Hashids decoding on incoming requests
 * and encoding on outgoing responses. This centralizes ID obfuscation logic,
 * keeping controllers and services clean and type-safe.
 */
@Injectable()
export class HashidsInterceptor implements NestInterceptor {
  constructor(private readonly hashidsService: HashidsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Part 1: Decoding Incoming Request
    // We now have a dedicated helper method for this, which improves type safety.
    if (request.body) {
      this.decodeRequest(request.body);
    }

    // Added logic to also decode IDs from route parameters
    if (request.params) {
      this.decodeRequest(request.params);
    }

    // Part 2: Encoding Outgoing Response
    // We use the `map` operator to transform the response stream before it's sent.
    return next.handle().pipe(
      map((response) => {
        // Apply encoding logic to the 'data' field of a wrapped response,
        // or directly to the response if it's a simple object/array.
        if (response && response.data) {
          response.data = this.encodeResponse(response.data);
        } else {
          response = this.encodeResponse(response);
        }
        return response;
      }),
    );
  }

  // --- Helper Methods for Decoding and Encoding ---

  /**
   * Recursively decodes Hashids in a request body.
   * This is a dedicated method to handle decoding logic safely.
   */
  private decodeRequest(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.decodeRequest(item));
    }

    // Handle objects
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        // Check for common ID fields and ensure the value is a string
        if (
          (key === 'productId' || key === 'itemId') &&
          typeof value === 'string'
        ) {
          const decodedId = this.hashidsService.decode(value);
          // Only replace the ID if the decoding was successful
          // TODO: Implement appropriate logging.
          console.log(`for logging purpose`);
          console.log(`key: ${key} value: ${decodedId}`);
          if (decodedId !== null) {
            data[key] = decodedId;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          data[key] = this.decodeRequest(value);
        }
      }
    }
    return data;
  }

  /**
   * Recursively encodes IDs in an outgoing response body.
   * This is a dedicated method for encoding logic.
   */
  private encodeResponse(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.encodeResponse(item));
    }

    // Handle objects
    const encodedObject = {} as any;
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        // Check for keys that need encoding
        if (
          (key === 'productId' || key === 'itemId') &&
          (typeof value === 'bigint' || typeof value === 'number')
        ) {
          encodedObject[key] = this.hashidsService.encode(value);
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          encodedObject[key] = this.encodeResponse(value);
        } else {
          encodedObject[key] = value;
        }
      }
    }
    return encodedObject;
  }
}
