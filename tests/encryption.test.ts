import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../src/services/encryption.service.js';

describe('EncryptionService (AES-256-GCM)', () => {
  it('should encrypt and decrypt plaintext accurately', () => {
    const originalSecret = 'my-super-secret-cloudinary-api-key-12345';

    const encrypted = EncryptionService.encrypt(originalSecret);

    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('authTag');
    expect(encrypted.ciphertext).not.toBe(originalSecret);

    const decrypted = EncryptionService.decrypt(encrypted);
    expect(decrypted).toBe(originalSecret);
  });

  it('should produce different ciphertext/iv for subsequent encryptions of the same plaintext', () => {
    const text = 'repeatable-secret';
    const encrypted1 = EncryptionService.encrypt(text);
    const encrypted2 = EncryptionService.encrypt(text);

    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);

    expect(EncryptionService.decrypt(encrypted1)).toBe(text);
    expect(EncryptionService.decrypt(encrypted2)).toBe(text);
  });

  it('should fail decryption if ciphertext or authTag is tampered with', () => {
    const encrypted = EncryptionService.encrypt('safe-data');

    // Tamper with the authTag
    const tamperedAuthTag = encrypted.authTag.slice(0, -2) + 'ff';
    expect(() =>
      EncryptionService.decrypt({
        ...encrypted,
        authTag: tamperedAuthTag,
      }),
    ).toThrow(/Decryption failed or data tampered/);
  });

  it('should safely mask secrets for API responses without exposing full keys', () => {
    expect(EncryptionService.maskSecret('987654321012345', 4)).toBe('********2345');
    expect(EncryptionService.maskSecret('123', 4)).toBe('********123');
    expect(EncryptionService.maskSecret('', 4)).toBe('********');
  });
});
