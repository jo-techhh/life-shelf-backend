import { describe, it, expect } from 'vitest';
import { SeriesService } from '../src/modules/series/series.service.js';

describe('SeriesService — Progress & Episode Tracking Logic', () => {
  it('should return 0% progress and null next episode for empty series', () => {
    const progress = SeriesService.calculateProgress([]);
    expect(progress.totalEpisodes).toBe(0);
    expect(progress.watchedEpisodes).toBe(0);
    expect(progress.progress).toBe(0);
    expect(progress.totalSeasons).toBe(0);
    expect(progress.completedSeasons).toBe(0);
    expect(progress.currentSeason).toBeNull();
    expect(progress.currentEpisode).toBeNull();
    expect(progress.nextUnwatchedEpisode).toBeNull();
  });

  it('should calculate accurate percentage and find the next unwatched episode', () => {
    const seasons = [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-1', seasonId: 's-1', episodeNumber: 1, title: 'Pilot', watched: true },
          { id: 'ep-2', seasonId: 's-1', episodeNumber: 2, title: 'Episode 2', watched: true },
          { id: 'ep-3', seasonId: 's-1', episodeNumber: 3, title: 'Episode 3', watched: false },
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          { id: 'ep-4', seasonId: 's-2', episodeNumber: 1, title: 'S2 E1', watched: false },
          { id: 'ep-5', seasonId: 's-2', episodeNumber: 2, title: 'S2 E2', watched: false },
        ],
      },
    ];

    const progress = SeriesService.calculateProgress(seasons);

    expect(progress.totalEpisodes).toBe(5);
    expect(progress.watchedEpisodes).toBe(2);
    expect(progress.progress).toBe(40); // 2 / 5 = 40%
    expect(progress.totalSeasons).toBe(2);
    expect(progress.completedSeasons).toBe(0); // Season 1 is not fully completed because episode 3 is unwatched
    expect(progress.currentSeason).toBe(1);
    expect(progress.currentEpisode).toBe(3);
    expect(progress.nextUnwatchedEpisode).toEqual({
      id: 'ep-3',
      seasonId: 's-1',
      seasonNumber: 1,
      episodeNumber: 3,
      title: 'Episode 3',
    });
  });

  it('should correctly count completed seasons and point to the next season when previous is done', () => {
    const seasons = [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-1', seasonId: 's-1', episodeNumber: 1, title: 'Pilot', watched: true },
          { id: 'ep-2', seasonId: 's-1', episodeNumber: 2, title: 'Finale', watched: true },
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          { id: 'ep-3', seasonId: 's-2', episodeNumber: 1, title: 'New Beginning', watched: false },
        ],
      },
    ];

    const progress = SeriesService.calculateProgress(seasons);

    expect(progress.totalEpisodes).toBe(3);
    expect(progress.watchedEpisodes).toBe(2);
    expect(progress.progress).toBe(67); // 2/3 = 66.67% -> 67%
    expect(progress.completedSeasons).toBe(1);
    expect(progress.currentSeason).toBe(2);
    expect(progress.currentEpisode).toBe(1);
    expect(progress.nextUnwatchedEpisode?.id).toBe('ep-3');
  });

  it('should show 100% progress and null next unwatched episode when all episodes are watched', () => {
    const seasons = [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-1', seasonId: 's-1', episodeNumber: 1, title: 'Pilot', watched: true },
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          { id: 'ep-2', seasonId: 's-2', episodeNumber: 1, title: 'Finale', watched: true },
        ],
      },
    ];

    const progress = SeriesService.calculateProgress(seasons);

    expect(progress.totalEpisodes).toBe(2);
    expect(progress.watchedEpisodes).toBe(2);
    expect(progress.progress).toBe(100);
    expect(progress.completedSeasons).toBe(2);
    expect(progress.nextUnwatchedEpisode).toBeNull();
    expect(progress.currentSeason).toBe(2);
    expect(progress.currentEpisode).toBe(1);
  });
});
