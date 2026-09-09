import { z } from 'zod';
import { priorityEnum } from '../movies/movie.schema.js';

export const studyTypeEnum = z.enum([
  'COURSE',
  'TECHNOLOGY',
  'SKILL',
  'TOPIC',
  'CERTIFICATION',
  'BOOK',
  'TUTORIAL',
  'OTHER',
]);

export const studyStatusEnum = z.enum(['PLANNED', 'LEARNING', 'COMPLETED', 'DROPPED']);

export const createStudyResourceSchema = z.object({
  title: z.string().min(1, 'Resource title is required').max(200),
  url: z.string().url('Invalid resource URL').optional().nullable(),
  type: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateStudyResourceSchema = createStudyResourceSchema.partial();

export const createStudyItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  type: studyTypeEnum.optional().default('COURSE'),
  status: studyStatusEnum.optional().default('PLANNED'),
  progress: z.number().int().min(0).max(100).optional().default(0),
  priority: priorityEnum.optional().default('MEDIUM'),
  targetDate: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  resources: z.array(createStudyResourceSchema).optional(),
});

export const updateStudyItemSchema = createStudyItemSchema.omit({ resources: true }).partial();

export const studyListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  type: studyTypeEnum.optional(),
  status: studyStatusEnum.optional(),
  priority: priorityEnum.optional(),
  tagId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'progress', 'targetDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateStudyItemInput = z.infer<typeof createStudyItemSchema>;
export type UpdateStudyItemInput = z.infer<typeof updateStudyItemSchema>;
export type CreateStudyResourceInput = z.infer<typeof createStudyResourceSchema>;
export type UpdateStudyResourceInput = z.infer<typeof updateStudyResourceSchema>;
export type StudyListQuery = z.infer<typeof studyListQuerySchema>;
