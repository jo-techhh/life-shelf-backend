import { z } from 'zod';

export const configureCloudinarySchema = z.object({
  cloudName: z.string().min(2, 'Cloud Name is required'),
  apiKey: z.string().min(5, 'API Key is required'),
  apiSecret: z.string().min(5, 'API Secret is required'),
});

export type ConfigureCloudinaryInput = z.infer<typeof configureCloudinarySchema>;
