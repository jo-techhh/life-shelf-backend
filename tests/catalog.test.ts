import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { StorageService } from '../src/services/storage.service.js';
import { requireAdmin } from '../src/middleware/auth.middleware.js';
import { prisma } from '../src/config/database.js';

describe('Admin Roles & Catalog Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAdmin middleware', () => {
    it('should reject standard USER with ForbiddenError (403)', () => {
      const req: any = {
        user: { id: 'user-1', email: 'user@example.com', username: 'standard', role: 'USER' },
      };
      const res: any = {};
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN user to proceed to next handler', () => {
      const req: any = {
        user: { id: 'admin-1', email: 'admin@lifeshelf.app', username: 'admin', role: 'ADMIN' },
      };
      const res: any = {};
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('CatalogService - Add To Shelf & Immutability', () => {
    it('should clone a catalog movie into a personal user movie', async () => {
      const adminId = 'admin-1';
      const userId = 'user-100';
      const catalogMovieId = 'cat-mov-1';

      const mockCatalogMovie = {
        id: catalogMovieId,
        createdById: adminId,
        title: 'Inception',
        description: 'Dream sharing tech',
        releaseYear: 2010,
        language: 'English',
        duration: 148,
        director: 'Christopher Nolan',
        cast: 'Leonardo DiCaprio',
        genre: 'Sci-Fi',
        mediaAssetId: 'asset-movie-cover',
      };

      vi.spyOn(prisma.catalogMovie, 'findUnique').mockResolvedValue(mockCatalogMovie as any);
      vi.spyOn(prisma.movie, 'create').mockImplementation(async (args: any) => {
        return {
          id: 'user-movie-500',
          ...args.data,
        } as any;
      });

      const userMovie = await CatalogService.addMovieToShelf(userId, catalogMovieId, {
        status: 'WATCHING',
        priority: 'HIGH',
        rating: 9.5,
        notes: 'Rewatching with friends',
      });

      expect(userMovie.id).toBe('user-movie-500');
      expect(userMovie.userId).toBe(userId);
      expect(userMovie.title).toBe('Inception');
      expect(userMovie.mediaAssetId).toBe('asset-movie-cover');
      expect(userMovie.status).toBe('WATCHING');
      expect(userMovie.priority).toBe('HIGH');
      expect(userMovie.rating).toBe(9.5);
    });

    it('should clone a catalog book into a personal reading item with progress calculation', async () => {
      const adminId = 'admin-1';
      const userId = 'user-100';
      const catalogBookId = 'cat-book-1';

      const mockCatalogBook = {
        id: catalogBookId,
        createdById: adminId,
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'Tiny changes',
        type: 'BOOK',
        totalPages: 320,
        genre: 'Self-Help',
        mediaAssetId: 'asset-book-cover',
      };

      vi.spyOn(prisma.catalogBook, 'findUnique').mockResolvedValue(mockCatalogBook as any);
      vi.spyOn(prisma.readingItem, 'create').mockImplementation(async (args: any) => {
        return {
          id: 'user-book-700',
          ...args.data,
        } as any;
      });

      const userBook = await CatalogService.addBookToShelf(userId, catalogBookId, {
        status: 'READING',
        priority: 'HIGH',
        currentPage: 160,
      });

      expect(userBook.id).toBe('user-book-700');
      expect(userBook.userId).toBe(userId);
      expect(userBook.title).toBe('Atomic Habits');
      expect(userBook.totalPages).toBe(320);
      expect(userBook.currentPage).toBe(160);
      expect(userBook.progress).toBe(50); // 160 / 320 = 50%
      expect(userBook.mediaAssetId).toBe('asset-book-cover');
    });

    it('should prevent standard users from deleting catalog media assets', async () => {
      const userId = 'user-1';
      const catalogAssetId = 'asset-cat-1';

      vi.spyOn(prisma.mediaAsset, 'findFirst').mockResolvedValue({
        id: catalogAssetId,
        userId: 'admin-1',
        isDefault: false,
        isCatalog: true,
      } as any);

      // Attempting to delete catalog asset must fail with BadRequestError
      await expect(
        StorageService.deleteAsset(userId, catalogAssetId),
      ).rejects.toThrow(/Cannot delete curated catalog media asset/);
    });
  });
});
