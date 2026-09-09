import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { StorageService } from '../../services/storage.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { DEFAULT_MEDIA_ASSETS } from '../../common/constants/defaults.js';

export class MediaController {
  public static async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file provided in "file" form field');
      }

      const mediaAsset = await StorageService.uploadFile(
        req.user!.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );

      ApiResponse.created(res, mediaAsset, 'Image uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async listUserMedia(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit
        ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10)))
        : 20;
      const search = req.query.search as string | undefined;

      const whereClause = {
        userId: req.user!.id,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      };

      const { skip, take } = getSkipTake(page, limit);

      const [total, assets] = await Promise.all([
        prisma.mediaAsset.count({ where: whereClause }),
        prisma.mediaAsset.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const pagination = calculatePagination(total, page, limit);
      ApiResponse.paginated(res, assets, pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getDefaultAssets(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // First try to fetch from database seeded default assets
      let defaults = await prisma.mediaAsset.findMany({
        where: { isDefault: true },
        orderBy: { name: 'asc' },
      });

      // If DB has not been seeded yet, return built-in constant defaults
      if (defaults.length === 0) {
        defaults = DEFAULT_MEDIA_ASSETS.map((d, index) => ({
          id: `default-${index + 1}`,
          userId: null,
          name: d.name,
          type: d.type,
          provider: d.provider,
          publicId: d.publicId,
          url: d.url,
          secureUrl: d.secureUrl,
          metadata: d.metadata,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      ApiResponse.success(res, defaults);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteMedia(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError('Media ID is required');
      }

      await StorageService.deleteAsset(req.user!.id, id);
      ApiResponse.success(res, { deleted: true }, 200, 'Media asset deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
