import { z } from 'zod';

export const updateShareConfigSchema = z.object({
  includeMovies: z.boolean().optional(),
  includeSeries: z.boolean().optional(),
});

export type UpdateShareConfigInput = z.infer<typeof updateShareConfigSchema>;
