import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MovieService } from '../src/modules/movies/movie.service.js';
import { SeriesService } from '../src/modules/series/series.service.js';
import { TravelService } from '../src/modules/travel/travel.service.js';
import { prisma } from '../src/config/database.js';

describe('Multi-Tenant Data Isolation (Rule 1 & 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MovieService should never return a movie belonging to another user', async () => {
    const user1Id = 'user-1';
    const user2Id = 'user-2';
    const movieId = 'movie-999';

    // Mock findFirst checking where: { id: movieId, userId: user2Id }
    vi.spyOn(prisma.movie, 'findFirst').mockImplementation(async (args: any) => {
      // If user1 owns the movie, return it only if args.where.userId === user1Id
      if (args.where.userId === user1Id && args.where.id === movieId) {
        return {
          id: movieId,
          userId: user1Id,
          title: 'Interstellar',
        } as any;
      }
      return null;
    });

    // User 1 can access own movie
    const user1Movie = await MovieService.getMovieById(user1Id, movieId);
    expect(user1Movie.title).toBe('Interstellar');

    // User 2 cannot access user 1's movie even if the exact ID is supplied
    await expect(MovieService.getMovieById(user2Id, movieId)).rejects.toThrow(
      /Movie not found/,
    );
  });

  it('SeriesService should prevent user from deleting another user series', async () => {
    const user1Id = 'user-1';
    const user2Id = 'user-2';
    const seriesId = 'series-123';

    vi.spyOn(prisma.series, 'findFirst').mockImplementation(async (args: any) => {
      if (args.where.userId === user1Id && args.where.id === seriesId) {
        return { id: seriesId, userId: user1Id } as any;
      }
      return null;
    });

    await expect(SeriesService.deleteSeries(user2Id, seriesId)).rejects.toThrow(
      /Series not found/,
    );
  });

  it('TravelService should reject creating a trip with places owned by another user', async () => {
    const user1Id = 'user-1';
    const foreignPlaceId = 'place-owned-by-user-2';

    // When querying user 1's places, foreign place is not returned
    vi.spyOn(prisma.travelPlace, 'findMany').mockResolvedValue([]);

    await expect(
      TravelService.createTrip(user1Id, {
        name: 'Tokyo Adventure',
        places: [{ placeId: foreignPlaceId, order: 1 }],
      }),
    ).rejects.toThrow(/One or more selected travel places do not belong to you/);
  });
});
