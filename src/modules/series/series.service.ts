import { prisma } from '../../config/database.js';
import {
  CreateSeriesInput,
  UpdateSeriesInput,
  CreateSeasonInput,
  UpdateSeasonInput,
  CreateEpisodeInput,
  UpdateEpisodeInput,
  SeriesListQuery,
  MarkWatchedInput,
} from './series.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export interface SeriesProgress {
  totalEpisodes: number;
  watchedEpisodes: number;
  progress: number;
  totalSeasons: number;
  completedSeasons: number;
  currentSeason: number | null;
  currentEpisode: number | null;
  nextUnwatchedEpisode: {
    id: string;
    seasonId: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string | null;
  } | null;
}

export class SeriesService {
  private static async validateMediaAsset(userId: string, mediaAssetId?: string | null) {
    if (!mediaAssetId) return;
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id: mediaAssetId,
        OR: [{ userId }, { isDefault: true }],
      },
    });
    if (!asset) {
      throw new BadRequestError('Specified media asset does not exist or you do not have permission to use it');
    }
  }

  public static calculateProgress(seasons: Array<{
    seasonNumber: number;
    episodes: Array<{
      id: string;
      seasonId: string;
      episodeNumber: number;
      title: string | null;
      watched: boolean;
    }>;
  }>): SeriesProgress {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;
    let completedSeasons = 0;

    const flattenedEpisodes: Array<{
      id: string;
      seasonId: string;
      seasonNumber: number;
      episodeNumber: number;
      title: string | null;
      watched: boolean;
    }> = [];

    const sortedSeasons = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);

    for (const season of sortedSeasons) {
      const sortedEpisodes = [...season.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
      let seasonWatchedCount = 0;

      for (const episode of sortedEpisodes) {
        totalEpisodes++;
        if (episode.watched) {
          watchedEpisodes++;
          seasonWatchedCount++;
        }
        flattenedEpisodes.push({
          id: episode.id,
          seasonId: episode.seasonId,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          watched: episode.watched,
        });
      }

      if (sortedEpisodes.length > 0 && seasonWatchedCount === sortedEpisodes.length) {
        completedSeasons++;
      }
    }

    const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
    const nextUnwatched = flattenedEpisodes.find((ep) => !ep.watched) || null;

    let currentSeason: number | null = null;
    let currentEpisode: number | null = null;

    if (nextUnwatched) {
      currentSeason = nextUnwatched.seasonNumber;
      currentEpisode = nextUnwatched.episodeNumber;
    } else if (flattenedEpisodes.length > 0) {
      const last = flattenedEpisodes[flattenedEpisodes.length - 1];
      if (last) {
        currentSeason = last.seasonNumber;
        currentEpisode = last.episodeNumber;
      }
    }

    return {
      totalEpisodes,
      watchedEpisodes,
      progress,
      totalSeasons: seasons.length,
      completedSeasons,
      currentSeason,
      currentEpisode,
      nextUnwatchedEpisode: nextUnwatched
        ? {
            id: nextUnwatched.id,
            seasonId: nextUnwatched.seasonId,
            seasonNumber: nextUnwatched.seasonNumber,
            episodeNumber: nextUnwatched.episodeNumber,
            title: nextUnwatched.title,
          }
        : null,
    };
  }

  public static async createSeries(userId: string, input: CreateSeriesInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { seasons, tagIds, ...seriesData } = input;

    const series = await prisma.$transaction(async (tx) => {
      const createdSeries = await tx.series.create({
        data: {
          ...seriesData,
          userId,
          tags: tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
          seasons: seasons && seasons.length > 0
            ? {
                create: seasons.map((s) => ({
                  seasonNumber: s.seasonNumber,
                  title: s.title,
                  description: s.description,
                  episodes: s.episodes && s.episodes.length > 0
                    ? {
                        create: s.episodes.map((e) => ({
                          episodeNumber: e.episodeNumber,
                          title: e.title,
                          description: e.description,
                          duration: e.duration,
                          note: e.note,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
          seasons: {
            include: {
              episodes: {
                orderBy: { episodeNumber: 'asc' },
              },
            },
            orderBy: { seasonNumber: 'asc' },
          },
        },
      });

      return createdSeries;
    });

    const progress = this.calculateProgress(series.seasons);

    return {
      ...series,
      progress,
    };
  }

  public static async getSeriesById(userId: string, seriesId: string) {
    const series = await prisma.series.findFirst({
      where: { id: seriesId, userId },
      include: {
        mediaAsset: true,
        tags: { include: { tag: true } },
        seasons: {
          include: {
            episodes: {
              orderBy: { episodeNumber: 'asc' },
            },
          },
          orderBy: { seasonNumber: 'asc' },
        },
      },
    });

    if (!series) {
      throw new NotFoundError('Series');
    }

    const progress = this.calculateProgress(series.seasons);

    return {
      ...series,
      progress,
    };
  }

  public static async listSeries(userId: string, query: SeriesListQuery) {
    const { page, limit, search, status, priority, genre, tagId, sortBy, sortOrder } = query;

    const where: Prisma.SeriesWhereInput = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(genre && { genre: { contains: genre, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tagId && {
        tags: {
          some: { tagId },
        },
      }),
    };

    const { skip, take } = getSkipTake(page, limit);

    const [total, seriesList] = await Promise.all([
      prisma.series.count({ where }),
      prisma.series.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
          seasons: {
            include: {
              episodes: {
                select: {
                  id: true,
                  seasonId: true,
                  episodeNumber: true,
                  title: true,
                  watched: true,
                },
              },
            },
            orderBy: { seasonNumber: 'asc' },
          },
        },
      }),
    ]);

    const dataWithProgress = seriesList.map((s) => {
      const progress = this.calculateProgress(s.seasons);
      return {
        ...s,
        progress,
      };
    });

    const pagination = calculatePagination(total, page, limit);
    return { series: dataWithProgress, pagination };
  }

  public static async updateSeries(userId: string, seriesId: string, input: UpdateSeriesInput) {
    const existing = await prisma.series.findFirst({
      where: { id: seriesId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Series');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { tagIds, ...seriesData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.seriesTag.deleteMany({ where: { seriesId } });
        if (tagIds.length > 0) {
          await tx.seriesTag.createMany({
            data: tagIds.map((tagId) => ({ seriesId, tagId })),
          });
        }
      }

      return tx.series.update({
        where: { id: seriesId },
        data: seriesData,
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
          seasons: {
            include: {
              episodes: { orderBy: { episodeNumber: 'asc' } },
            },
            orderBy: { seasonNumber: 'asc' },
          },
        },
      });
    });

    const progress = this.calculateProgress(updated.seasons);

    return {
      ...updated,
      progress,
    };
  }

  public static async deleteSeries(userId: string, seriesId: string) {
    const existing = await prisma.series.findFirst({
      where: { id: seriesId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Series');
    }

    await prisma.series.delete({
      where: { id: seriesId },
    });

    return { deleted: true };
  }

  // --- Season Management ---

  public static async createSeason(userId: string, seriesId: string, input: CreateSeasonInput) {
    const series = await prisma.series.findFirst({
      where: { id: seriesId, userId },
    });

    if (!series) {
      throw new NotFoundError('Series');
    }

    const season = await prisma.season.create({
      data: {
        seriesId,
        seasonNumber: input.seasonNumber,
        title: input.title,
        description: input.description,
        episodes: input.episodes && input.episodes.length > 0
          ? {
              create: input.episodes.map((e) => ({
                episodeNumber: e.episodeNumber,
                title: e.title,
                description: e.description,
                duration: e.duration,
                note: e.note,
              })),
            }
          : undefined,
      },
      include: {
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });

    return season;
  }

  public static async updateSeason(userId: string, seasonId: string, input: UpdateSeasonInput) {
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        series: { userId },
      },
    });

    if (!season) {
      throw new NotFoundError('Season');
    }

    const updated = await prisma.season.update({
      where: { id: seasonId },
      data: input,
      include: {
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });

    return updated;
  }

  public static async deleteSeason(userId: string, seasonId: string) {
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        series: { userId },
      },
    });

    if (!season) {
      throw new NotFoundError('Season');
    }

    await prisma.season.delete({
      where: { id: seasonId },
    });

    return { deleted: true };
  }

  // --- Episode Management ---

  public static async createEpisode(userId: string, seasonId: string, input: CreateEpisodeInput) {
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        series: { userId },
      },
    });

    if (!season) {
      throw new NotFoundError('Season');
    }

    const episode = await prisma.episode.create({
      data: {
        seasonId,
        episodeNumber: input.episodeNumber,
        title: input.title,
        description: input.description,
        duration: input.duration,
        note: input.note,
      },
    });

    return episode;
  }

  public static async updateEpisode(userId: string, episodeId: string, input: UpdateEpisodeInput) {
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: { userId },
        },
      },
    });

    if (!episode) {
      throw new NotFoundError('Episode');
    }

    const updated = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        ...input,
        ...(input.watched !== undefined && {
          watched: input.watched,
          watchedAt: input.watched ? new Date() : null,
        }),
      },
    });

    return updated;
  }

  public static async deleteEpisode(userId: string, episodeId: string) {
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: { userId },
        },
      },
    });

    if (!episode) {
      throw new NotFoundError('Episode');
    }

    await prisma.episode.delete({
      where: { id: episodeId },
    });

    return { deleted: true };
  }

  // --- Watched Tracking ---

  public static async markEpisodeWatched(
    userId: string,
    episodeId: string,
    input?: MarkWatchedInput,
  ) {
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: { userId },
        },
      },
    });

    if (!episode) {
      throw new NotFoundError('Episode');
    }

    const updated = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        watched: true,
        watchedAt: new Date(),
        ...(input?.note !== undefined && { note: input.note }),
      },
    });

    return updated;
  }

  public static async unmarkEpisodeWatched(userId: string, episodeId: string) {
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: { userId },
        },
      },
    });

    if (!episode) {
      throw new NotFoundError('Episode');
    }

    const updated = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        watched: false,
        watchedAt: null,
      },
    });

    return updated;
  }
}
