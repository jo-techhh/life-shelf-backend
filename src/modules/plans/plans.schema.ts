import { z } from 'zod';
import { priorityEnum } from '../movies/movie.schema.js';

export const planTypeEnum = z.enum([
  'MOVIE',
  'SERIES_EPISODE',
  'READING',
  'STUDY',
  'TRAVEL',
  'OTHER',
]);

export const planStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export const createPlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  type: planTypeEnum.optional().default('OTHER'),
  scheduledDate: z.string().datetime({ offset: true }).optional().nullable(),
  priority: priorityEnum.optional().default('MEDIUM'),
  status: planStatusEnum.optional().default('PLANNED'),
  notes: z.string().max(5000).optional().nullable(),
  referenceId: z.string().optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const planListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  type: planTypeEnum.optional(),
  status: planStatusEnum.optional(),
  priority: priorityEnum.optional(),
  tagId: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  sortBy: z.enum(['scheduledDate', 'createdAt', 'title', 'priority']).optional().default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanListQuery = z.infer<typeof planListQuerySchema>;
