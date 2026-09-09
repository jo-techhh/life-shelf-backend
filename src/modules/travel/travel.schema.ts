import { z } from 'zod';
import { priorityEnum } from '../movies/movie.schema.js';

export const travelStatusEnum = z.enum(['WANT_TO_VISIT', 'PLANNING', 'VISITED']);
export const tripStatusEnum = z.enum(['PLANNING', 'BOOKED', 'ONGOING', 'COMPLETED', 'CANCELLED']);

// Travel Place schemas
export const createTravelPlaceSchema = z.object({
  name: z.string().min(1, 'Place name is required').max(200),
  country: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  priority: priorityEnum.optional().default('MEDIUM'),
  status: travelStatusEnum.optional().default('WANT_TO_VISIT'),
  estimatedBudget: z.number().min(0).optional().nullable(),
  targetDate: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const updateTravelPlaceSchema = createTravelPlaceSchema.partial();

export const travelPlaceListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  country: z.string().optional(),
  status: travelStatusEnum.optional(),
  priority: priorityEnum.optional(),
  tagId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'estimatedBudget', 'targetDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Trip Place junction schema
export const tripPlaceInputSchema = z.object({
  placeId: z.string().min(1, 'placeId is required'),
  order: z.number().int().min(0).optional().default(0),
  notes: z.string().max(1000).optional().nullable(),
});

// Trip schemas
export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  status: tripStatusEnum.optional().default('PLANNING'),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  places: z.array(tripPlaceInputSchema).optional(),
});

export const updateTripSchema = createTripSchema.omit({ places: true }).partial();

export const tripListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  status: tripStatusEnum.optional(),
  sortBy: z.enum(['createdAt', 'name', 'startDate', 'budget']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTravelPlaceInput = z.infer<typeof createTravelPlaceSchema>;
export type UpdateTravelPlaceInput = z.infer<typeof updateTravelPlaceSchema>;
export type TravelPlaceListQuery = z.infer<typeof travelPlaceListQuerySchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripPlaceInput = z.infer<typeof tripPlaceInputSchema>;
export type TripListQuery = z.infer<typeof tripListQuerySchema>;
