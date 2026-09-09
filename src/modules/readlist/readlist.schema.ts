import { z } from 'zod';
import { priorityEnum } from '../movies/movie.schema.js';

export const readingTypeEnum = z.enum([
  'BOOK',
  'ARTICLE',
  'PAPER',
  'BLOG',
  'DOCUMENTATION',
  'OTHER',
]);

export const readingStatusEnum = z.enum(['PLANNED', 'READING', 'COMPLETED', 'DROPPED']);

export const createReadingItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  author: z.string().max(100).optional().nullable(),
  type: readingTypeEnum.optional().default('BOOK'),
  status: readingStatusEnum.optional().default('PLANNED'),
  progress: z.number().int().min(0).max(100).optional().default(0),
  totalPages: z.number().int().positive().optional().nullable(),
  currentPage: z.number().int().min(0).optional().nullable(),
  rating: z.number().min(0).max(10).optional().nullable(),
  priority: priorityEnum.optional().default('MEDIUM'),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const updateReadingItemSchema = createReadingItemSchema.partial();

export const readingListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  type: readingTypeEnum.optional(),
  status: readingStatusEnum.optional(),
  priority: priorityEnum.optional(),
  tagId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'progress', 'rating']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateReadingItemInput = z.infer<typeof createReadingItemSchema>;
export type UpdateReadingItemInput = z.infer<typeof updateReadingItemSchema>;
export type ReadingListQuery = z.infer<typeof readingListQuerySchema>;
