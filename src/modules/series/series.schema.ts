import { z } from 'zod';
import { priorityEnum } from '../movies/movie.schema.js';

export const seriesStatusEnum = z.enum(['PLANNED', 'WATCHING', 'WATCHED', 'DROPPED']);

export const createEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive('Episode number must be a positive integer'),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export const updateEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive().optional(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  watched: z.boolean().optional(),
});

export const createSeasonSchema = z.object({
  seasonNumber: z.number().int().positive('Season number must be a positive integer'),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  episodes: z.array(createEpisodeSchema).optional(),
});

export const updateSeasonSchema = z.object({
  seasonNumber: z.number().int().positive().optional(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const createSeriesSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  releaseYear: z.number().int().min(1880).max(2100).optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  rating: z.number().min(0).max(10).optional().nullable(),
  status: seriesStatusEnum.optional().default('PLANNED'),
  priority: priorityEnum.optional().default('MEDIUM'),
  notes: z.string().max(5000).optional().nullable(),
  mediaAssetId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  seasons: z.array(createSeasonSchema).optional(),
});

export const updateSeriesSchema = createSeriesSchema.omit({ seasons: true }).partial();

export const seriesListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  status: seriesStatusEnum.optional(),
  priority: priorityEnum.optional(),
  genre: z.string().optional(),
  tagId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'rating', 'releaseYear']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const markWatchedSchema = z.object({
  note: z.string().max(2000).optional().nullable(),
});

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;
export type SeriesListQuery = z.infer<typeof seriesListQuerySchema>;
export type MarkWatchedInput = z.infer<typeof markWatchedSchema>;
