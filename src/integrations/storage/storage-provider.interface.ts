export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: Record<string, unknown>;
  tags?: string[];
}

export interface UploadedAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface StorageProvider {
  readonly providerName: string;
  upload(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<UploadedAsset>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string): string;
  verifyConnection?(): Promise<boolean>;
}
