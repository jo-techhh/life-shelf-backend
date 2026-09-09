import { prisma } from '../../config/database.js';
import {
  CreateStudyItemInput,
  UpdateStudyItemInput,
  CreateStudyResourceInput,
  UpdateStudyResourceInput,
  StudyListQuery,
} from './studylist.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export class StudylistService {
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

  public static async createStudyItem(userId: string, input: CreateStudyItemInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { resources, tagIds, targetDate, ...itemData } = input;

    const item = await prisma.studyItem.create({
      data: {
        ...itemData,
        targetDate: targetDate ? new Date(targetDate) : null,
        userId,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        resources: resources && resources.length > 0
          ? {
              create: resources.map((r) => ({
                title: r.title,
                url: r.url,
                type: r.type,
                notes: r.notes,
              })),
            }
          : undefined,
      },
      include: {
        mediaAsset: true,
        resources: true,
        tags: { include: { tag: true } },
      },
    });

    return item;
  }

  public static async getStudyItemById(userId: string, id: string) {
    const item = await prisma.studyItem.findFirst({
      where: { id, userId },
      include: {
        mediaAsset: true,
        resources: true,
        tags: { include: { tag: true } },
      },
    });

    if (!item) {
      throw new NotFoundError('Study item');
    }

    return item;
  }

  public static async listStudyItems(userId: string, query: StudyListQuery) {
    const { page, limit, search, type, status, priority, tagId, sortBy, sortOrder } = query;

    const where: Prisma.StudyItemWhereInput = {
      userId,
      ...(type && { type }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
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
      prisma.studyItem.count({ where }),
      prisma.studyItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mediaAsset: true,
          resources: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { items, pagination };
  }

  public static async updateStudyItem(
    userId: string,
    id: string,
    input: UpdateStudyItemInput,
  ) {
    const existing = await prisma.studyItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Study item');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { tagIds, targetDate, ...itemData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.studyTag.deleteMany({ where: { studyItemId: id } });
        if (tagIds.length > 0) {
          await tx.studyTag.createMany({
            data: tagIds.map((tagId) => ({ studyItemId: id, tagId })),
          });
        }
      }

      return tx.studyItem.update({
        where: { id },
        data: {
          ...itemData,
          ...(targetDate !== undefined && {
            targetDate: targetDate ? new Date(targetDate) : null,
          }),
        },
        include: {
          mediaAsset: true,
          resources: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return updated;
  }

  public static async deleteStudyItem(userId: string, id: string) {
    const existing = await prisma.studyItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Study item');
    }

    await prisma.studyItem.delete({
      where: { id },
    });

    return { deleted: true };
  }

  // --- Resource Management ---

  public static async addResource(
    userId: string,
    studyItemId: string,
    input: CreateStudyResourceInput,
  ) {
    const item = await prisma.studyItem.findFirst({
      where: { id: studyItemId, userId },
    });

    if (!item) {
      throw new NotFoundError('Study item');
    }

    const resource = await prisma.studyResource.create({
      data: {
        studyItemId,
        title: input.title,
        url: input.url,
        type: input.type,
        notes: input.notes,
      },
    });

    return resource;
  }

  public static async updateResource(
    userId: string,
    resourceId: string,
    input: UpdateStudyResourceInput,
  ) {
    const resource = await prisma.studyResource.findFirst({
      where: {
        id: resourceId,
        studyItem: { userId },
      },
    });

    if (!resource) {
      throw new NotFoundError('Study resource');
    }

    const updated = await prisma.studyResource.update({
      where: { id: resourceId },
      data: input,
    });

    return updated;
  }

  public static async deleteResource(userId: string, resourceId: string) {
    const resource = await prisma.studyResource.findFirst({
      where: {
        id: resourceId,
        studyItem: { userId },
      },
    });

    if (!resource) {
      throw new NotFoundError('Study resource');
    }

    await prisma.studyResource.delete({
      where: { id: resourceId },
    });

    return { deleted: true };
  }
}
