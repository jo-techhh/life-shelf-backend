import { prisma } from '../../config/database.js';
import { CreateMovieInput, UpdateMovieInput, MovieListQuery } from './movie.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export class MovieService {
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

  public static async createMovie(userId: string, input: CreateMovieInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { tagIds, ...movieData } = input;

    const movie = await prisma.movie.create({
      data: {
        ...movieData,
        userId,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
      },
      include: {
        mediaAsset: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return movie;
  }

  public static async getMovieById(userId: string, movieId: string) {
    const movie = await prisma.movie.findFirst({
      where: {
        id: movieId,
        userId,
      },
      include: {
        mediaAsset: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundError('Movie');
    }

    return movie;
  }

  public static async listMovies(userId: string, query: MovieListQuery) {
    const { page, limit, search, status, priority, genre, tagId, sortBy, sortOrder } = query;

    const where: Prisma.MovieWhereInput = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(genre && { genre: { contains: genre, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { director: { contains: search, mode: 'insensitive' } },
          { cast: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tagId && {
        tags: {
          some: { tagId },
        },
      }),
    };

    const { skip, take } = getSkipTake(page, limit);

    const [total, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mediaAsset: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { movies, pagination };
  }

  public static async updateMovie(userId: string, movieId: string, input: UpdateMovieInput) {
    const existing = await prisma.movie.findFirst({
      where: { id: movieId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Movie');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { tagIds, ...movieData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.movieTag.deleteMany({ where: { movieId } });
        if (tagIds.length > 0) {
          await tx.movieTag.createMany({
            data: tagIds.map((tagId) => ({ movieId, tagId })),
          });
        }
      }

      return tx.movie.update({
        where: { id: movieId },
        data: movieData,
        include: {
          mediaAsset: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return updated;
  }

  public static async deleteMovie(userId: string, movieId: string) {
    const existing = await prisma.movie.findFirst({
      where: { id: movieId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Movie');
    }

    await prisma.movie.delete({
      where: { id: movieId },
    });

    return { deleted: true };
  }
}
