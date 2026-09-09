import { prisma } from '../../config/database.js';
import {
  CreateReadingItemInput,
  UpdateReadingItemInput,
  ReadingListQuery,
} from './readlist.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export class ReadlistService {
  private static async validateMediaAsset(userId: string, mediaAssetId?: string | null) {
    if (!mediaAssetId) return;
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id: mediaAssetId,
        OR: [{ userId }, { isDefault: true }],
      },
    });
    if (!asset) {
      throw new BadRequestError('Specified media asset does not exist or you do not have permission to use it');
    }
  }

  private static computeProgress(
    progress?: number,
    currentPage?: number | null,
    totalPages?: number | null,
  ): number {
    if (currentPage != null && totalPages != null && totalPages > 0) {
      return Math.min(100, Math.round((currentPage / totalPages) * 100));
    }
    return progress != null ? Math.min(100, Math.max(0, progress)) : 0;
  }

  public static async createReadingItem(userId: string, input: CreateReadingItemInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { tagIds, ...itemData } = input;
    const finalProgress = this.computeProgress(
      itemData.progress,
      itemData.currentPage,
      itemData.totalPages,
    );

    const item = await prisma.readingItem.create({
      data: {
        ...itemData,
        progress: finalProgress,
        userId,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        mediaAsset: true,
        tags: { include: { tag: true } },
      },
    });

    return item;
  }

  public static async getReadingItemById(userId: string, id: string) {
    const item = await prisma.readingItem.findFirst({
      where: { id, userId },
      include: {
        mediaAsset: true,
        tags: { include: { tag: true } },
      },
    });

    if (!item) {
      throw new NotFoundError('Reading item');
    }

    return item;
  }

  public static async listReadingItems(userId: string, query: ReadingListQuery) {
    const { page, limit, search, type, status, priority, tagId, sortBy, sortOrder } = query;

    const where: Prisma.ReadingItemWhereInput = {
      userId,
      ...(type && { type }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tagId && {
        tags: {
          some: { tagId },
        },
      }),
    };

    const { skip, take } = getSkipTake(page, limit);

    const [total, items] = await Promise.all([
      prisma.readingItem.count({ where }),
      prisma.readingItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { items, pagination };
  }

  public static async updateReadingItem(
    userId: string,
    id: string,
    input: UpdateReadingItemInput,
  ) {
    const existing = await prisma.readingItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Reading item');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { tagIds, ...itemData } = input;

    const currentPage = itemData.currentPage !== undefined ? itemData.currentPage : existing.currentPage;
    const totalPages = itemData.totalPages !== undefined ? itemData.totalPages : existing.totalPages;
    const rawProgress = itemData.progress !== undefined ? itemData.progress : existing.progress;

    const finalProgress = this.computeProgress(rawProgress, currentPage, totalPages);

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.readingTag.deleteMany({ where: { readingItemId: id } });
        if (tagIds.length > 0) {
          await tx.readingTag.createMany({
            data: tagIds.map((tagId) => ({ readingItemId: id, tagId })),
          });
        }
      }

      return tx.readingItem.update({
        where: { id },
        data: {
          ...itemData,
          progress: finalProgress,
        },
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return updated;
  }

  public static async deleteReadingItem(userId: string, id: string) {
    const existing = await prisma.readingItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Reading item');
    }

    await prisma.readingItem.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
