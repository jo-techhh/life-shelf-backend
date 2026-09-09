import { Request, Response, NextFunction } from 'express';
import { TravelService } from './travel.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class TravelController {
  // --- Places ---

  public static async createPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const place = await TravelService.createPlace(req.user!.id, req.body);
      ApiResponse.created(res, place, 'Travel place created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const place = await TravelService.getPlaceById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, place);
    } catch (error) {
      next(error);
    }
  }

  public static async listPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TravelService.listPlaces(
        req.user!.id,
        req.query as unknown as Parameters<typeof TravelService.listPlaces>[1],
      );
      ApiResponse.paginated(res, result.places, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updatePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const place = await TravelService.updatePlace(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, place, 200, 'Travel place updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deletePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TravelService.deletePlace(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Travel place deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Trips ---

  public static async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = await TravelService.createTrip(req.user!.id, req.body);
      ApiResponse.created(res, trip, 'Trip created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = await TravelService.getTripById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, trip);
    } catch (error) {
      next(error);
    }
  }

  public static async listTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TravelService.listTrips(
        req.user!.id,
        req.query as unknown as Parameters<typeof TravelService.listTrips>[1],
      );
      ApiResponse.paginated(res, result.trips, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = await TravelService.updateTrip(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, trip, 200, 'Trip updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TravelService.deleteTrip(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Trip deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addPlaceToTrip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tripPlace = await TravelService.addPlaceToTrip(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.created(res, tripPlace, 'Place added to trip successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async removePlaceFromTrip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await TravelService.removePlaceFromTrip(
        req.user!.id,
        req.params.id as string,
        req.params.placeId as string,
      );
      ApiResponse.success(res, { removed: true }, 200, 'Place removed from trip');
    } catch (error) {
      next(error);
    }
  }
}
