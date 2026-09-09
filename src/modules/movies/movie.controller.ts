import { Request, Response, NextFunction } from 'express';
import { MovieService } from './movie.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class MovieController {
  public static async createMovie(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movie = await MovieService.createMovie(req.user!.id, req.body);
      ApiResponse.created(res, movie, 'Movie created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getMovie(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movie = await MovieService.getMovieById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, movie);
    } catch (error) {
      next(error);
    }
  }

  public static async listMovies(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await MovieService.listMovies(
        req.user!.id,
        req.query as unknown as Parameters<typeof MovieService.listMovies>[1],
      );
      ApiResponse.paginated(res, result.movies, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updateMovie(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movie = await MovieService.updateMovie(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, movie, 200, 'Movie updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteMovie(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await MovieService.deleteMovie(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Movie deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
