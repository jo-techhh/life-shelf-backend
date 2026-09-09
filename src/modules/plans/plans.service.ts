import { prisma } from '../../config/database.js';
import { CreatePlanInput, UpdatePlanInput, PlanListQuery } from './plans.schema.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export class PlansService {
  public static async createPlan(userId: string, input: CreatePlanInput) {
    const { tagIds, scheduledDate, ...planData } = input;

    const plan = await prisma.plan.create({
      data: {
        ...planData,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
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
        tags: { include: { tag: true } },
      },
    });

    return plan;
  }

  public static async getPlanById(userId: string, id: string) {
    const plan = await prisma.plan.findFirst({
      where: { id, userId },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan');
    }

    return plan;
  }

  public static async listPlans(userId: string, query: PlanListQuery) {
    const {
      page,
      limit,
      search,
      type,
      status,
      priority,
      tagId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.PlanWhereInput = {
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
      ...((startDate || endDate) && {
        scheduledDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const { skip, take } = getSkipTake(page, limit);

    const [total, plans] = await Promise.all([
      prisma.plan.count({ where }),
      prisma.plan.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tags: { include: { tag: true } },
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { plans, pagination };
  }

  public static async updatePlan(userId: string, id: string, input: UpdatePlanInput) {
    const existing = await prisma.plan.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Plan');
    }

    const { tagIds, scheduledDate, ...planData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.planTag.deleteMany({ where: { planId: id } });
        if (tagIds.length > 0) {
          await tx.planTag.createMany({
            data: tagIds.map((tagId) => ({ planId: id, tagId })),
          });
        }
      }

      return tx.plan.update({
        where: { id },
        data: {
          ...planData,
          ...(scheduledDate !== undefined && {
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          }),
        },
        include: {
          tags: { include: { tag: true } },
        },
      });
    });

    return updated;
  }

  public static async deletePlan(userId: string, id: string) {
    const existing = await prisma.plan.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Plan');
    }

    await prisma.plan.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
