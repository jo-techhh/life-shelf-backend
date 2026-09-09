import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { EncryptionService } from './encryption.service.js';
import { StorageProvider, UploadedAsset, UploadOptions } from '../integrations/storage/storage-provider.interface.js';
import { CloudinaryProvider } from '../integrations/storage/cloudinary.provider.js';
import { BadRequestError, NotFoundError } from '../common/errors/app-error.js';
import { Prisma } from '@prisma/client';

export class StorageService {
  /**
   * Resolves an appropriate StorageProvider for a user.
   * Priority:
   * 1. User's personal configured cloud storage (decrypted on-the-fly)
   * 2. Fallback to system default Cloudinary if configured in environment
   */
  public static async getProviderForUser(userId: string): Promise<StorageProvider> {
    const userConfig = await prisma.cloudStorageConfig.findUnique({
      where: { userId },
    });

    if (userConfig && userConfig.isConfigured) {
      if (userConfig.provider === 'CLOUDINARY') {
        const decryptedStr = EncryptionService.decrypt({
          ciphertext: userConfig.encryptedApiSecret,
          iv: userConfig.iv,
          authTag: userConfig.authTag,
        });

        let apiKey = '';
        let apiSecret = '';

        try {
          const parsed = JSON.parse(decryptedStr);
          apiKey = parsed.apiKey;
          apiSecret = parsed.apiSecret;
        } catch {
          apiSecret = decryptedStr;
          apiKey = userConfig.apiKeyMasked;
        }

        return new CloudinaryProvider({
          cloudName: userConfig.cloudName,
          apiKey,
          apiSecret,
        });
      }
    }

    // Fallback to server-level default Cloudinary if present
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return new CloudinaryProvider({
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      });
    }

    throw new BadRequestError(
      'No cloud storage configured. Please configure your Cloudinary credentials under /api/storage/cloudinary before uploading files.',
    );
  }

  /**
   * Uploads an asset for a user and creates a MediaAsset record in PostgreSQL
   */
  public static async uploadFile(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options?: UploadOptions,
  ) {
    const provider = await this.getProviderForUser(userId);

    const uploaded: UploadedAsset = await provider.upload(fileBuffer, fileName, {
      folder: `lifeshelf/users/${userId}`,
      ...options,
    });

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        userId,
        name: fileName,
        type: mimeType,
        provider: provider.providerName,
        publicId: uploaded.publicId,
        url: uploaded.url,
        secureUrl: uploaded.secureUrl,
        metadata: (uploaded.metadata as Prisma.InputJsonValue) || {},
        isDefault: false,
      },
    });

    return mediaAsset;
  }

  /**
   * Deletes a user-owned media asset
   */
  public static async deleteAsset(userId: string, mediaAssetId: string): Promise<void> {
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id: mediaAssetId,
        userId,
      },
    });

    if (!asset) {
      throw new NotFoundError('Media asset');
    }

    if (asset.isDefault) {
      throw new BadRequestError('Cannot delete system default media asset');
    }

    try {
      const provider = await this.getProviderForUser(userId);
      await provider.delete(asset.publicId);
    } catch {
      // Continue deleting from DB even if remote is already deleted
    }

    await prisma.mediaAsset.delete({
      where: { id: mediaAssetId },
    });
  }
}
