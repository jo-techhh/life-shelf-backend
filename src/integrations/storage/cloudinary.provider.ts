import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageProvider, UploadedAsset, UploadOptions } from './storage-provider.interface.js';
import { AppError } from '../../common/errors/app-error.js';
import streamifier from 'stream';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryProvider implements StorageProvider {
  public readonly providerName = 'CLOUDINARY';
  private readonly config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    this.config = config;
  }

  private configure() {
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: true,
    });
  }

  public async upload(
    fileBuffer: Buffer,
    _fileName: string,
    options?: UploadOptions,
  ): Promise<UploadedAsset> {
    this.configure();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder || 'lifeshelf',
          public_id: options?.publicId,
          tags: options?.tags,
          resource_type: 'auto',
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              new AppError(
                `Cloudinary upload failed: ${error?.message || 'Unknown error'}`,
                502,
                'STORAGE_UPLOAD_ERROR',
              ),
            );
          }

          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            provider: this.providerName,
            metadata: {
              resourceType: result.resource_type,
              createdAt: result.created_at,
            },
          });
        },
      );

      const readableStream = new streamifier.Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  public async delete(publicId: string): Promise<void> {
    this.configure();
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: unknown) {
      throw new AppError(
        `Cloudinary deletion failed: ${(err as Error).message}`,
        502,
        'STORAGE_DELETE_ERROR',
      );
    }
  }

  public getUrl(publicId: string): string {
    this.configure();
    return cloudinary.url(publicId, { secure: true });
  }

  public async verifyConnection(): Promise<boolean> {
    this.configure();
    try {
      const result = await cloudinary.api.ping();
      return result.status === 'ok';
    } catch {
      return false;
    }
  }
}
