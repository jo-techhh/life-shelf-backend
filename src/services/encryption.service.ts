import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../common/errors/app-error.js';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 16 bytes for GCM

  /**
   * Derives a consistent 32-byte Buffer key from the environment variable.
   * Supports 64-character hex strings or arbitrary strings (hashed via sha256 to exactly 32 bytes).
   */
  private static getKey(): Buffer {
    const rawKey = env.ENCRYPTION_KEY;
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext using AES-256-GCM with a random initialization vector.
   */
  public static encrypt(plainText: string): EncryptedPayload {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      let ciphertext = cipher.update(plainText, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (err: unknown) {
      throw new AppError('Encryption failed', 500, 'CRYPTO_ERROR', (err as Error).message);
    }
  }

  /**
   * Decrypts AES-256-GCM encrypted ciphertext with authentication verification.
   */
  public static decrypt(encrypted: EncryptedPayload): string {
    try {
      const key = this.getKey();
      const iv = Buffer.from(encrypted.iv, 'hex');
      const authTag = Buffer.from(encrypted.authTag, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: unknown) {
      throw new AppError('Decryption failed or data tampered', 500, 'CRYPTO_ERROR', (err as Error).message);
    }
  }

  /**
   * Generates a safe masked version of a sensitive key (e.g., "********1234")
   */
  public static maskSecret(key: string, visibleChars = 4): string {
    if (!key) return '********';
    if (key.length <= visibleChars) return '********' + key;
    return '********' + key.slice(-visibleChars);
  }
}
