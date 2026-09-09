import { Request, Response, NextFunction } from 'express';
import { ReadlistService } from './readlist.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class ReadlistController {
  public static async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await ReadlistService.createReadingItem(req.user!.id, req.body);
      ApiResponse.created(res, item, 'Reading item created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await ReadlistService.getReadingItemById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, item);
    } catch (error) {
      next(error);
    }
  }

  public static async listItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReadlistService.listReadingItems(
        req.user!.id,
        req.query as unknown as Parameters<typeof ReadlistService.listReadingItems>[1],
      );
      ApiResponse.paginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await ReadlistService.updateReadingItem(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, item, 200, 'Reading item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ReadlistService.deleteReadingItem(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Reading item deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
