import { z } from 'zod';

export const CreateCatalogMovieSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  releaseYear: z
    .number()
    .int()
    .min(1888)
    .max(new Date().getFullYear() + 10)
    .optional()
    .nullable(),
  language: z.string().max(100).optional().nullable(),
  duration: z.number().int().min(1).optional().nullable(),
  director: z.string().max(255).optional().nullable(),
  cast: z.string().optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
});

export const UpdateCatalogMovieSchema = CreateCatalogMovieSchema.partial();

export const AddMovieToShelfSchema = z.object({
  status: z.enum(['PLANNED', 'WATCHING', 'WATCHED', 'DROPPED']).optional().default('PLANNED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  rating: z.number().min(0).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const CreateCatalogBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  author: z.string().max(255).optional().nullable(),
  type: z
    .enum(['BOOK', 'ARTICLE', 'PAPER', 'BLOG', 'DOCUMENTATION', 'OTHER'])
    .optional()
    .default('BOOK'),
  totalPages: z.number().int().min(1).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
});

export const UpdateCatalogBookSchema = CreateCatalogBookSchema.partial();

export const AddBookToShelfSchema = z.object({
  status: z.enum(['PLANNED', 'READING', 'COMPLETED', 'DROPPED']).optional().default('PLANNED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  rating: z.number().min(0).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
  currentPage: z.number().int().min(0).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const CatalogQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  genre: z.string().optional(),
  releaseYear: z.string().optional(),
  author: z.string().optional(),
  type: z.string().optional(),
});

export type CreateCatalogMovieInput = z.infer<typeof CreateCatalogMovieSchema>;
export type UpdateCatalogMovieInput = z.infer<typeof UpdateCatalogMovieSchema>;
export type AddMovieToShelfInput = z.infer<typeof AddMovieToShelfSchema>;

export type CreateCatalogBookInput = z.infer<typeof CreateCatalogBookSchema>;
export type UpdateCatalogBookInput = z.infer<typeof UpdateCatalogBookSchema>;
export type AddBookToShelfInput = z.infer<typeof AddBookToShelfSchema>;
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;
