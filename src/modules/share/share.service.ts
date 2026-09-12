import { randomBytes } from 'crypto';
import { prisma } from '../../config/database.js';
import { AppError, NotFoundError } from '../../common/errors/app-error.js';

export class ShareService {
  public static async getStatus(userId: string) {
    const share = await prisma.sharedWatchList.findUnique({
      where: { userId },
    });

    if (!share) {
      return { isActive: false };
    }

    return {
      isActive: share.isActive,
      token: share.shareToken,
      includeMovies: share.includeMovies,
      includeSeries: share.includeSeries,
    };
  }

  public static async enableShare(userId: string) {
    const existing = await prisma.sharedWatchList.findUnique({
      where: { userId },
    });

    // If already exists, generate a new token if not present, and set isActive to true
    const shareToken = existing?.shareToken || randomBytes(16).toString('hex');

    const share = await prisma.sharedWatchList.upsert({
      where: { userId },
      update: {
        isActive: true,
        shareToken,
      },
      create: {
        userId,
        shareToken,
        isActive: true,
      },
    });

    return {
      isActive: share.isActive,
      token: share.shareToken,
      includeMovies: share.includeMovies,
      includeSeries: share.includeSeries,
    };
  }

  public static async revokeShare(userId: string) {
    // Setting isActive to false retains the token record so we know it was revoked rather than never existing
    await prisma.sharedWatchList.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { success: true };
  }

  public static async getPublicWatchList(token: string) {
    const share = await prisma.sharedWatchList.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // If token does not exist at all in the database -> 404 Not Found
    if (!share) {
      throw new NotFoundError('Shared watch list');
    }

    // If token exists but is marked inactive -> 410 Gone / Revoked
    if (!share.isActive) {
      throw new AppError('The owner has revoked public access to this watch list', 410, 'SHARE_LINK_REVOKED');
    }

    // Fetch movies marked WATCHED (safe public fields only)
    const movies = share.includeMovies
      ? await prisma.movie.findMany({
          where: {
            userId: share.userId,
            status: 'WATCHED',
          },
          select: {
            id: true,
            title: true,
            description: true,
            releaseYear: true,
            language: true,
            duration: true,
            director: true,
            cast: true,
            rating: true,
            genre: true,
            createdAt: true,
            updatedAt: true,
            mediaAsset: {
              select: {
                id: true,
                url: true,
                secureUrl: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    // Fetch series marked WATCHED (safe public fields only)
    const series = share.includeSeries
      ? await prisma.series.findMany({
          where: {
            userId: share.userId,
            status: 'WATCHED',
          },
          select: {
            id: true,
            title: true,
            description: true,
            releaseYear: true,
            language: true,
            rating: true,
            genre: true,
            createdAt: true,
            updatedAt: true,
            mediaAsset: {
              select: {
                id: true,
                url: true,
                secureUrl: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    return {
      user: share.user,
      movies,
      series,
    };
  }
}
