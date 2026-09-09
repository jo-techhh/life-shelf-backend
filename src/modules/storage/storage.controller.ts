import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { EncryptionService } from '../../services/encryption.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { CloudinaryProvider } from '../../integrations/storage/cloudinary.provider.js';
import { BadRequestError } from '../../common/errors/app-error.js';

export class StorageController {
  public static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await prisma.cloudStorageConfig.findUnique({
        where: { userId: req.user!.id },
      });

      if (!config) {
        ApiResponse.success(res, {
          configured: false,
          provider: null,
          cloudName: null,
          apiKey: null,
        });
        return;
      }

      ApiResponse.success(res, {
        provider: config.provider.toLowerCase(),
        cloudName: config.cloudName,
        apiKey: config.apiKeyMasked,
        configured: config.isConfigured,
        updatedAt: config.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async configureCloudinary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { cloudName, apiKey, apiSecret } = req.body;

      // Optional verification test with provider
      const testProvider = new CloudinaryProvider({
        cloudName,
        apiKey,
        apiSecret,
      });

      const isPingValid = await testProvider.verifyConnection();
      if (!isPingValid) {
        throw new BadRequestError(
          'Could not verify Cloudinary credentials. Please verify your Cloud Name, API Key, and API Secret.',
        );
      }

      // Encrypt sensitive credentials payload
      const encryptedPayload = EncryptionService.encrypt(
        JSON.stringify({ apiKey, apiSecret }),
      );
      const maskedKey = EncryptionService.maskSecret(apiKey, 4);

      const updatedConfig = await prisma.cloudStorageConfig.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          provider: 'CLOUDINARY',
          cloudName,
          apiKeyMasked: maskedKey,
          encryptedApiKey: maskedKey,
          encryptedApiSecret: encryptedPayload.ciphertext,
          iv: encryptedPayload.iv,
          authTag: encryptedPayload.authTag,
          isConfigured: true,
        },
        update: {
          provider: 'CLOUDINARY',
          cloudName,
          apiKeyMasked: maskedKey,
          encryptedApiKey: maskedKey,
          encryptedApiSecret: encryptedPayload.ciphertext,
          iv: encryptedPayload.iv,
          authTag: encryptedPayload.authTag,
          isConfigured: true,
        },
      });

      ApiResponse.success(
        res,
        {
          provider: updatedConfig.provider.toLowerCase(),
          cloudName: updatedConfig.cloudName,
          apiKey: updatedConfig.apiKeyMasked,
          configured: updatedConfig.isConfigured,
        },
        200,
        'Cloudinary configuration saved successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  public static async deleteConfig(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await prisma.cloudStorageConfig.deleteMany({
        where: { userId: req.user!.id },
      });

      ApiResponse.success(
        res,
        { configured: false },
        200,
        'Cloud storage configuration deleted successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
