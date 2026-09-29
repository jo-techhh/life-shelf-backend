import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import {
  CreateCatalogMovieInput,
  UpdateCatalogMovieInput,
  AddMovieToShelfInput,
  CreateCatalogBookInput,
  UpdateCatalogBookInput,
  AddBookToShelfInput,
  CatalogQuery,
} from './catalog.schema.js';

export class CatalogController {
  // ==========================================
  // Movies
  // ==========================================

  public static async createMovie(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as CreateCatalogMovieInput;
      const movie = await CatalogService.createMovie(req.user!.id, input);
      ApiResponse.created(res, movie, 'Catalog movie created successfully');
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
      const query = req.query as unknown as CatalogQuery;
      const { items, pagination } = await CatalogService.listMovies(query);
      ApiResponse.paginated(res, items, pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getMovieById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movie = await CatalogService.getMovieById(req.params.id as string);
      ApiResponse.success(res, movie);
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
      const input = req.body as UpdateCatalogMovieInput;
      const movie = await CatalogService.updateMovie(req.params.id as string, input);
      ApiResponse.success(res, movie, 200, 'Catalog movie updated successfully');
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
      await CatalogService.deleteMovie(req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Catalog movie deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addMovieToShelf(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const options = (req.body || {}) as AddMovieToShelfInput;
      const personalMovie = await CatalogService.addMovieToShelf(
        req.user!.id,
        req.params.id as string,
        options,
      );
      ApiResponse.created(res, personalMovie, 'Movie successfully added to your personal shelf');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Books
  // ==========================================

  public static async createBook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as CreateCatalogBookInput;
      const book = await CatalogService.createBook(req.user!.id, input);
      ApiResponse.created(res, book, 'Catalog book created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async listBooks(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query as unknown as CatalogQuery;
      const { items, pagination } = await CatalogService.listBooks(query);
      ApiResponse.paginated(res, items, pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getBookById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const book = await CatalogService.getBookById(req.params.id as string);
      ApiResponse.success(res, book);
    } catch (error) {
      next(error);
    }
  }

  public static async updateBook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as UpdateCatalogBookInput;
      const book = await CatalogService.updateBook(req.params.id as string, input);
      ApiResponse.success(res, book, 200, 'Catalog book updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteBook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await CatalogService.deleteBook(req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Catalog book deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addBookToShelf(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const options = (req.body || {}) as AddBookToShelfInput;
      const personalBook = await CatalogService.addBookToShelf(
        req.user!.id,
        req.params.id as string,
        options,
      );
      ApiResponse.created(res, personalBook, 'Book successfully added to your personal reading shelf');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Cover Media Upload
  // ==========================================

  public static async uploadCover(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file provided in "file" form field');
      }

      const mediaAsset = await CatalogService.uploadCatalogCover(
        req.user!.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );

      ApiResponse.created(res, mediaAsset, 'Catalog cover uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
}
