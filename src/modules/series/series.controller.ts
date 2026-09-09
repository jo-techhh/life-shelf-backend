import { Request, Response, NextFunction } from 'express';
import { SeriesService } from './series.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class SeriesController {
  // --- Series ---

  public static async createSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const series = await SeriesService.createSeries(req.user!.id, req.body);
      ApiResponse.created(res, series, 'Series created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const series = await SeriesService.getSeriesById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, series);
    } catch (error) {
      next(error);
    }
  }

  public static async listSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SeriesService.listSeries(
        req.user!.id,
        req.query as unknown as Parameters<typeof SeriesService.listSeries>[1],
      );
      ApiResponse.paginated(res, result.series, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updateSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const series = await SeriesService.updateSeries(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, series, 200, 'Series updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SeriesService.deleteSeries(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Series deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Seasons ---

  public static async createSeason(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const season = await SeriesService.createSeason(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.created(res, season, 'Season created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateSeason(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const season = await SeriesService.updateSeason(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, season, 200, 'Season updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteSeason(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SeriesService.deleteSeason(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Season deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Episodes ---

  public static async createEpisode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const episode = await SeriesService.createEpisode(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.created(res, episode, 'Episode created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateEpisode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const episode = await SeriesService.updateEpisode(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, episode, 200, 'Episode updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteEpisode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SeriesService.deleteEpisode(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Episode deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Watched Tracking ---

  public static async markWatched(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const episode = await SeriesService.markEpisodeWatched(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, episode, 200, 'Episode marked as watched');
    } catch (error) {
      next(error);
    }
  }

  public static async unmarkWatched(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const episode = await SeriesService.unmarkEpisodeWatched(
        req.user!.id,
        req.params.id as string,
      );
      ApiResponse.success(res, episode, 200, 'Episode unmarked as watched');
    } catch (error) {
      next(error);
    }
  }
}
