import { prisma } from '../../config/database.js';
import {
  CreateTravelPlaceInput,
  UpdateTravelPlaceInput,
  TravelPlaceListQuery,
  CreateTripInput,
  UpdateTripInput,
  TripPlaceInput,
  TripListQuery,
} from './travel.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';
import { calculatePagination, getSkipTake } from '../../common/utils/pagination.js';
import { Prisma } from '@prisma/client';

export class TravelService {
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

  // --- Travel Places ---

  public static async createPlace(userId: string, input: CreateTravelPlaceInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { tagIds, targetDate, ...placeData } = input;

    const place = await prisma.travelPlace.create({
      data: {
        ...placeData,
        targetDate: targetDate ? new Date(targetDate) : null,
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

    return place;
  }

  public static async getPlaceById(userId: string, id: string) {
    const place = await prisma.travelPlace.findFirst({
      where: { id, userId },
      include: {
        mediaAsset: true,
        tags: { include: { tag: true } },
        tripPlaces: {
          include: {
            trip: {
              select: { id: true, name: true, status: true, startDate: true, endDate: true },
            },
          },
        },
      },
    });

    if (!place) {
      throw new NotFoundError('Travel place');
    }

    return place;
  }

  public static async listPlaces(userId: string, query: TravelPlaceListQuery) {
    const { page, limit, search, country, status, priority, tagId, sortBy, sortOrder } = query;

    const where: Prisma.TravelPlaceWhereInput = {
      userId,
      ...(country && { country: { contains: country, mode: 'insensitive' } }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
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

    const [total, places] = await Promise.all([
      prisma.travelPlace.count({ where }),
      prisma.travelPlace.findMany({
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
    return { places, pagination };
  }

  public static async updatePlace(
    userId: string,
    id: string,
    input: UpdateTravelPlaceInput,
  ) {
    const existing = await prisma.travelPlace.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Travel place');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { tagIds, targetDate, ...placeData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.travelPlaceTag.deleteMany({ where: { placeId: id } });
        if (tagIds.length > 0) {
          await tx.travelPlaceTag.createMany({
            data: tagIds.map((tagId) => ({ placeId: id, tagId })),
          });
        }
      }

      return tx.travelPlace.update({
        where: { id },
        data: {
          ...placeData,
          ...(targetDate !== undefined && {
            targetDate: targetDate ? new Date(targetDate) : null,
          }),
        },
        include: {
          mediaAsset: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return updated;
  }

  public static async deletePlace(userId: string, id: string) {
    const existing = await prisma.travelPlace.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Travel place');
    }

    await prisma.travelPlace.delete({
      where: { id },
    });

    return { deleted: true };
  }

  // --- Trips ---

  public static async createTrip(userId: string, input: CreateTripInput) {
    await this.validateMediaAsset(userId, input.mediaAssetId);

    const { places, startDate, endDate, ...tripData } = input;

    // Validate that all places belong to the user
    if (places && places.length > 0) {
      const placeIds = places.map((p) => p.placeId);
      const userPlaces = await prisma.travelPlace.findMany({
        where: { id: { in: placeIds }, userId },
        select: { id: true },
      });
      if (userPlaces.length !== placeIds.length) {
        throw new BadRequestError('One or more selected travel places do not belong to you');
      }
    }

    const trip = await prisma.trip.create({
      data: {
        ...tripData,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId,
        tripPlaces: places && places.length > 0
          ? {
              create: places.map((p) => ({
                placeId: p.placeId,
                order: p.order ?? 0,
                notes: p.notes,
              })),
            }
          : undefined,
      },
      include: {
        mediaAsset: true,
        tripPlaces: {
          include: {
            place: {
              include: { mediaAsset: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return trip;
  }

  public static async getTripById(userId: string, id: string) {
    const trip = await prisma.trip.findFirst({
      where: { id, userId },
      include: {
        mediaAsset: true,
        tripPlaces: {
          include: {
            place: {
              include: { mediaAsset: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError('Trip');
    }

    return trip;
  }

  public static async listTrips(userId: string, query: TripListQuery) {
    const { page, limit, search, status, sortBy, sortOrder } = query;

    const where: Prisma.TripWhereInput = {
      userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const { skip, take } = getSkipTake(page, limit);

    const [total, trips] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mediaAsset: true,
          tripPlaces: {
            include: {
              place: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return { trips, pagination };
  }

  public static async updateTrip(userId: string, id: string, input: UpdateTripInput) {
    const existing = await prisma.trip.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Trip');
    }

    if (input.mediaAssetId !== undefined) {
      await this.validateMediaAsset(userId, input.mediaAssetId);
    }

    const { startDate, endDate, ...tripData } = input;

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        ...tripData,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      },
      include: {
        mediaAsset: true,
        tripPlaces: {
          include: { place: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  public static async deleteTrip(userId: string, id: string) {
    const existing = await prisma.trip.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Trip');
    }

    await prisma.trip.delete({
      where: { id },
    });

    return { deleted: true };
  }

  public static async addPlaceToTrip(
    userId: string,
    tripId: string,
    input: TripPlaceInput,
  ) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip) {
      throw new NotFoundError('Trip');
    }

    const place = await prisma.travelPlace.findFirst({
      where: { id: input.placeId, userId },
    });
    if (!place) {
      throw new NotFoundError('Travel place');
    }

    const tripPlace = await prisma.tripPlace.upsert({
      where: {
        tripId_placeId: {
          tripId,
          placeId: input.placeId,
        },
      },
      create: {
        tripId,
        placeId: input.placeId,
        order: input.order ?? 0,
        notes: input.notes,
      },
      update: {
        order: input.order ?? 0,
        notes: input.notes,
      },
      include: {
        place: true,
      },
    });

    return tripPlace;
  }

  public static async removePlaceFromTrip(
    userId: string,
    tripId: string,
    placeId: string,
  ) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip) {
      throw new NotFoundError('Trip');
    }

    await prisma.tripPlace.deleteMany({
      where: { tripId, placeId },
    });

    return { removed: true };
  }
}
