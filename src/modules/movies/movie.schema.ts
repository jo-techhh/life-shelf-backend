import { z } from 'zod';

export const movieStatusEnum = z.enum(['PLANNED', 'WATCHING', 'WATCHED', 'DROPPED']);
export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createMovieSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  releaseYear: z.number().int().min(1880).max(2100).optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  duration: z.number().int().positive('Duration must be positive in minutes').optional().nullable(),
  director: z.string().max(100).optional().nullable(),
  cast: z.string().max(500).optional().nullable(),
  rating: z.number().min(0).max(10).optional().nullable(),
  status: movieStatusEnum.optional().default('PLANNED'),
  priority: priorityEnum.optional().default('MEDIUM'),
  genre: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const updateMovieSchema = createMovieSchema.partial();

export const movieListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  status: movieStatusEnum.optional(),
  priority: priorityEnum.optional(),
  genre: z.string().optional(),
  tagId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'rating', 'releaseYear']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type MovieListQuery = z.infer<typeof movieListQuerySchema>;
