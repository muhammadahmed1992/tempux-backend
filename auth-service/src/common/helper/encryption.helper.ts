// src/common/encryption/encryption.helper.ts

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class EncryptionHelper {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = "aes-256-gcm"; // Define algorithm as a class property

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>("EMAIL_ENCRYPTION_KEY");

    if (!key || key.length !== 64) {
      // Validate key length immediately on instantiation
      throw new InternalServerErrorException(
        "EncryptionHelper: EMAIL_ENCRYPTION_KEY is missing or invalid in environment variables. It must be a 64-character hex string (32 bytes)."
      );
    }
    this.encryptionKey = Buffer.from(key, "hex");
  }

  /**
   * Encrypts a string using AES-256-GCM.
   * The IV and auth tag are prepended to the ciphertext, separated by colons.
   * Format: iv:encryptedData:authTag (all in hex)
   * @param text - The plain text string to encrypt.
   * @returns The encrypted string.
   */
  public encrypt(text: string): string {
    // Changed to instance method (removed static)
    const iv = crypto.randomBytes(16); // Initialization Vector (16 bytes for AES)
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    ); // Use instance properties

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex"); // Authentication Tag

    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
  }

  /**
   * Decrypts a string encrypted with AES-256-GCM.
   * Expects the format: iv:encryptedData:authTag (all in hex).
   * @param encryptedText - The encrypted string.
   * @returns The decrypted plain text string.
   * @throws Error if decryption fails (e.g., invalid key, corrupted data, tampered data).
   */
  public decrypt(encryptedText: string): string {
    // Changed to instance method (removed static)
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new InternalServerErrorException( // Use NestJS exception for consistent response
        "Invalid encrypted data format. Expected iv:encryptedData:authTag"
      );
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedDataBuffer = Buffer.from(parts[1], "hex"); // Ensure this is a Buffer
    const authTag = Buffer.from(parts[2], "hex");

    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      ); // Use instance properties
      decipher.setAuthTag(authTag); // Set the authentication tag BEFORE update/final

      // Corrected line: If encryptedDataBuffer is already a Buffer,
      // the second argument is the output encoding directly.
      // Fix: Call update to get a Buffer, then convert to string
      let decrypted = decipher.update(encryptedDataBuffer).toString("utf8");
      decrypted += decipher.final().toString("utf8"); // Final also returns Buffer, convert it
      return decrypted;
    } catch (error) {
      // Catch specific error for invalid authentication tag
      if (
        (error as any).message ===
        "Unsupported state or unable to authenticate data"
      ) {
        console.error(
          "Decryption Error: Invalid authentication tag or corrupted data. This could indicate tampering or incorrect key/IV."
        );
        throw new InternalServerErrorException(
          "Decryption failed: Data integrity compromised or invalid key."
        );
      }
      console.error("Decryption Error:", error);
      throw new InternalServerErrorException(
        `Decryption failed: ${(error as any).message}`
      );
    }
  }
}
