import { prisma } from '../../config/database.js';
import { SeriesService } from '../series/series.service.js';

export class DashboardService {
  public static async getDashboardData(userId: string) {
    const now = new Date();

    // 1. Run count aggregations in parallel
    const [
      movieCount,
      seriesCount,
      readingCount,
      studyCount,
      travelCount,
      planCount,
    ] = await Promise.all([
      prisma.movie.count({ where: { userId } }),
      prisma.series.count({ where: { userId } }),
      prisma.readingItem.count({ where: { userId } }),
      prisma.studyItem.count({ where: { userId } }),
      prisma.travelPlace.count({ where: { userId } }),
      prisma.plan.count({ where: { userId } }),
    ]);

    // 2. Continue Watching (Watching movies + Watching series with progress)
    const [watchingMovies, watchingSeries] = await Promise.all([
      prisma.movie.findMany({
        where: { userId, status: 'WATCHING' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { mediaAsset: true },
      }),
      prisma.series.findMany({
        where: { userId, status: 'WATCHING' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          mediaAsset: true,
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

    const continueWatching = [
      ...watchingMovies.map((m) => ({
        type: 'MOVIE',
        id: m.id,
        title: m.title,
        mediaAsset: m.mediaAsset,
        updatedAt: m.updatedAt,
      })),
      ...watchingSeries.map((s) => ({
        type: 'SERIES',
        id: s.id,
        title: s.title,
        mediaAsset: s.mediaAsset,
        progress: SeriesService.calculateProgress(s.seasons),
        updatedAt: s.updatedAt,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // 3. Continue Reading
    const continueReading = await prisma.readingItem.findMany({
      where: { userId, status: 'READING' },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { mediaAsset: true },
    });

    // 4. Continue Studying
    const continueStudying = await prisma.studyItem.findMany({
      where: { userId, status: 'LEARNING' },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { mediaAsset: true },
    });

    // 5. Upcoming Plans
    const upcomingPlans = await prisma.plan.findMany({
      where: {
        userId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        OR: [
          { scheduledDate: { gte: now } },
          { scheduledDate: null },
        ],
      },
      take: 5,
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
    });

    // 6. Recently Completed across modules
    const [completedMovies, completedReading, completedStudy] = await Promise.all([
      prisma.movie.findMany({
        where: { userId, status: 'WATCHED' },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, updatedAt: true, mediaAsset: true },
      }),
      prisma.readingItem.findMany({
        where: { userId, status: 'COMPLETED' },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, type: true, updatedAt: true, mediaAsset: true },
      }),
      prisma.studyItem.findMany({
        where: { userId, status: 'COMPLETED' },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, type: true, updatedAt: true, mediaAsset: true },
      }),
    ]);

    const recentlyCompleted = [
      ...completedMovies.map((m) => ({ category: 'MOVIE', ...m })),
      ...completedReading.map((r) => ({ category: 'READING', ...r })),
      ...completedStudy.map((s) => ({ category: 'STUDY', ...s })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);

    return {
      counts: {
        movies: movieCount,
        series: seriesCount,
        reading: readingCount,
        study: studyCount,
        travel: travelCount,
        plans: planCount,
      },
      continueWatching,
      continueReading,
      continueStudying,
      upcomingPlans,
      recentlyCompleted,
    };
  }
}
