import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { ConflictError, NotFoundError } from '../../common/errors/app-error.js';

export class TagsController {
  public static async listTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await prisma.tag.findMany({
        where: { userId: req.user!.id },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              movieTags: true,
              seriesTags: true,
              readingTags: true,
              studyTags: true,
              travelPlaceTags: true,
              planTags: true,
            },
          },
        },
      });

      const formattedTags = tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        itemCount:
          t._count.movieTags +
          t._count.seriesTags +
          t._count.readingTags +
          t._count.studyTags +
          t._count.travelPlaceTags +
          t._count.planTags,
        createdAt: t.createdAt,
      }));

      ApiResponse.success(res, formattedTags);
    } catch (error) {
      next(error);
    }
  }

  public static async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: req.user!.id,
            name: req.body.name.trim(),
          },
        },
      });

      if (existing) {
        throw new ConflictError(`Tag "${req.body.name}" already exists`);
      }

      const tag = await prisma.tag.create({
        data: {
          userId: req.user!.id,
          name: req.body.name.trim(),
          color: req.body.color || '#6366f1',
        },
      });

      ApiResponse.created(res, tag, 'Tag created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await prisma.tag.findFirst({
        where: { id, userId: req.user!.id },
      });

      if (!existing) {
        throw new NotFoundError('Tag');
      }

      const updated = await prisma.tag.update({
        where: { id },
        data: {
          ...(req.body.name && { name: req.body.name.trim() }),
          ...(req.body.color !== undefined && { color: req.body.color }),
        },
      });

      ApiResponse.success(res, updated, 200, 'Tag updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await prisma.tag.findFirst({
        where: { id, userId: req.user!.id },
      });

      if (!existing) {
        throw new NotFoundError('Tag');
      }

      await prisma.tag.delete({
        where: { id },
      });

      ApiResponse.success(res, { deleted: true }, 200, 'Tag deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
