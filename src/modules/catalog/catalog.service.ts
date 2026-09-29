import { prisma } from '../../config/database.js';
import {
  CreateCatalogMovieInput,
  UpdateCatalogMovieInput,
  AddMovieToShelfInput,
  CreateCatalogBookInput,
  UpdateCatalogBookInput,
  AddBookToShelfInput,
  CatalogQuery,
} from './catalog.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { StorageService } from '../../services/storage.service.js';
import { Prisma } from '@prisma/client';

export class CatalogService {
  /**
   * Helper to ensure an attached media asset is flagged as catalog-usable
   */
  private static async markAssetAsCatalog(mediaAssetId?: string | null): Promise<void> {
    if (!mediaAssetId) return;
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
    if (!asset) {
      throw new BadRequestError('Specified media asset does not exist');
    }
    if (!asset.isCatalog) {
      await prisma.mediaAsset.update({
        where: { id: mediaAssetId },
        data: { isCatalog: true },
      });
    }
  }

  // ==========================================
  // Catalog Movies
  // ==========================================

  public static async createMovie(adminId: string, input: CreateCatalogMovieInput) {
    if (input.mediaAssetId) {
      await this.markAssetAsCatalog(input.mediaAssetId);
    }

    return prisma.catalogMovie.create({
      data: {
        ...input,
        createdById: adminId,
      },
      include: {
        mediaAsset: true,
      },
    });
  }

  public static async listMovies(query: CatalogQuery) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const { skip, take } = getSkipTake(page, limit);

    const where: Prisma.CatalogMovieWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { director: { contains: query.search, mode: 'insensitive' } },
        { cast: { contains: query.search, mode: 'insensitive' } },
        { genre: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.genre) {
      where.genre = { contains: query.genre, mode: 'insensitive' };
    }

    if (query.releaseYear) {
      const year = parseInt(query.releaseYear, 10);
      if (!isNaN(year)) {
        where.releaseYear = year;
      }
    }

    const [total, items] = await Promise.all([
      prisma.catalogMovie.count({ where }),
      prisma.catalogMovie.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          mediaAsset: true,
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { items, pagination };
  }

  public static async getMovieById(id: string) {
    const movie = await prisma.catalogMovie.findUnique({
      where: { id },
      include: {
        mediaAsset: true,
      },
    });

    if (!movie) {
      throw new NotFoundError('Catalog Movie');
    }

    return movie;
  }

  public static async updateMovie(id: string, input: UpdateCatalogMovieInput) {
    await this.getMovieById(id);

    if (input.mediaAssetId) {
      await this.markAssetAsCatalog(input.mediaAssetId);
    }

    return prisma.catalogMovie.update({
      where: { id },
      data: input,
      include: {
        mediaAsset: true,
      },
    });
  }

  public static async deleteMovie(id: string) {
    await this.getMovieById(id);

    return prisma.catalogMovie.delete({
      where: { id },
    });
  }

  public static async addMovieToShelf(
    userId: string,
    catalogMovieId: string,
    options: AddMovieToShelfInput,
  ) {
    const catalogMovie = await this.getMovieById(catalogMovieId);

    const { tagIds, status, priority, rating, notes } = options;

    const movie = await prisma.movie.create({
      data: {
        userId,
        title: catalogMovie.title,
        description: catalogMovie.description,
        releaseYear: catalogMovie.releaseYear,
        language: catalogMovie.language,
        duration: catalogMovie.duration,
        director: catalogMovie.director,
        cast: catalogMovie.cast,
        genre: catalogMovie.genre,
        mediaAssetId: catalogMovie.mediaAssetId,
        status: status || 'PLANNED',
        priority: priority || 'MEDIUM',
        rating: rating !== undefined ? rating : null,
        notes: notes !== undefined ? notes : null,
        tags:
          tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
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

  // ==========================================
  // Catalog Books
  // ==========================================

  public static async createBook(adminId: string, input: CreateCatalogBookInput) {
    if (input.mediaAssetId) {
      await this.markAssetAsCatalog(input.mediaAssetId);
    }

    return prisma.catalogBook.create({
      data: {
        ...input,
        createdById: adminId,
      },
      include: {
        mediaAsset: true,
      },
    });
  }

  public static async listBooks(query: CatalogQuery) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const { skip, take } = getSkipTake(page, limit);

    const where: Prisma.CatalogBookWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { contains: query.search, mode: 'insensitive' } },
        { genre: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.author) {
      where.author = { contains: query.author, mode: 'insensitive' };
    }

    if (query.genre) {
      where.genre = { contains: query.genre, mode: 'insensitive' };
    }

    if (query.type) {
      where.type = query.type as any;
    }

    const [total, items] = await Promise.all([
      prisma.catalogBook.count({ where }),
      prisma.catalogBook.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          mediaAsset: true,
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { items, pagination };
  }

  public static async getBookById(id: string) {
    const book = await prisma.catalogBook.findUnique({
      where: { id },
      include: {
        mediaAsset: true,
      },
    });

    if (!book) {
      throw new NotFoundError('Catalog Book');
    }

    return book;
  }

  public static async updateBook(id: string, input: UpdateCatalogBookInput) {
    await this.getBookById(id);

    if (input.mediaAssetId) {
      await this.markAssetAsCatalog(input.mediaAssetId);
    }

    return prisma.catalogBook.update({
      where: { id },
      data: input,
      include: {
        mediaAsset: true,
      },
    });
  }

  public static async deleteBook(id: string) {
    await this.getBookById(id);

    return prisma.catalogBook.delete({
      where: { id },
    });
  }

  public static async addBookToShelf(
    userId: string,
    catalogBookId: string,
    options: AddBookToShelfInput,
  ) {
    const catalogBook = await this.getBookById(catalogBookId);

    const { tagIds, status, priority, rating, notes, currentPage } = options;

    let progress = 0;
    if (currentPage != null && catalogBook.totalPages != null && catalogBook.totalPages > 0) {
      progress = Math.min(100, Math.round((currentPage / catalogBook.totalPages) * 100));
    }

    const item = await prisma.readingItem.create({
      data: {
        userId,
        title: catalogBook.title,
        description: catalogBook.description,
        author: catalogBook.author,
        type: catalogBook.type,
        totalPages: catalogBook.totalPages,
        currentPage: currentPage ?? null,
        progress,
        mediaAssetId: catalogBook.mediaAssetId,
        status: status || 'PLANNED',
        priority: priority || 'MEDIUM',
        rating: rating !== undefined ? rating : null,
        notes: notes !== undefined ? notes : null,
        tags:
          tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
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

    return item;
  }

  // ==========================================
  // Catalog Media Upload (Admin only)
  // ==========================================

  public static async uploadCatalogCover(
    adminId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    const mediaAsset = await StorageService.uploadFile(
      adminId,
      fileBuffer,
      fileName,
      mimeType,
    );

    return prisma.mediaAsset.update({
      where: { id: mediaAsset.id },
      data: { isCatalog: true },
    });
  }
}
