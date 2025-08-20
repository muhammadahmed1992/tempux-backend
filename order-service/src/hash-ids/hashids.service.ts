// src/hashids/hashids.service.ts
import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Hashids from 'hashids';

@Injectable()
export class HashidsService implements OnModuleInit {
  private hashids!: Hashids;
  private readonly minLength = 6;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const salt = this.configService.get<string>('HASHIDS_SALT');

    if (!salt) {
      // Check if salt is missing or default
      console.error(
        'HASHIDS_SALT environment variable is not set. Please set it securely.',
      );
      throw new InternalServerErrorException('Something went wrong.');
    } else {
      this.hashids = new Hashids(salt, this.minLength);
      console.log('Hashids initialized with salt from ConfigService.');
    }
  }

  /**
   * Encodes a BigInt (or number) ID into a short, obfuscated string.
   * @param id The BigInt or number to encode.
   * @returns The encoded string.
   */
  encode(id: number | bigint): string {
    try {
      return this.hashids.encode(id);
    } catch (error: any) {
      console.error(`Failed to encode ID ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate public ID.');
    }
  }
  /**
   * Decodes an obfuscated string back into its original BigInt ID.
   * Returns null if decoding fails or the result is not a valid BigInt.
   * @param hash The string to decode.
   * @returns The decoded BigInt ID, or null if invalid.
   */
  decode(hash: string): bigint | null {
    try {
      const decoded = this.hashids.decode(hash);
      if (decoded.length === 0) {
        return null;
      }
      return typeof decoded[0] === 'bigint' ? decoded[0] : BigInt(decoded[0]);
    } catch (error: any) {
      console.error(
        `Failed to decode hash "${hash}": ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
