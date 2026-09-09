import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../src/services/storage.service.js';
import { EncryptionService } from '../src/services/encryption.service.js';
import { CloudinaryProvider } from '../src/integrations/storage/cloudinary.provider.js';
import { prisma } from '../src/config/database.js';

describe('Storage Abstraction & Provider Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CloudinaryProvider should implement StorageProvider interface methods', () => {
    const provider = new CloudinaryProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
    });

    expect(provider.providerName).toBe('CLOUDINARY');
    expect(typeof provider.upload).toBe('function');
    expect(typeof provider.delete).toBe('function');
    expect(typeof provider.getUrl).toBe('function');
  });

  it('StorageService should decrypt user credentials and instantiate provider', async () => {
    const rawApiKey = 'my-custom-key';
    const rawApiSecret = 'my-custom-secret';

    const encPayload = EncryptionService.encrypt(
      JSON.stringify({ apiKey: rawApiKey, apiSecret: rawApiSecret }),
    );

    vi.spyOn(prisma.cloudStorageConfig, 'findUnique').mockResolvedValue({
      id: 'cfg-1',
      userId: 'user-789',
      provider: 'CLOUDINARY',
      cloudName: 'personal-cloud',
      apiKeyMasked: '********-key',
      encryptedApiKey: '********-key',
      encryptedApiSecret: encPayload.ciphertext,
      iv: encPayload.iv,
      authTag: encPayload.authTag,
      isConfigured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const provider = await StorageService.getProviderForUser('user-789');
    expect(provider.providerName).toBe('CLOUDINARY');
  });
});
