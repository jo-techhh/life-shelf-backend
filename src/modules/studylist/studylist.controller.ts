import { Request, Response, NextFunction } from 'express';
import { StudylistService } from './studylist.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class StudylistController {
  public static async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await StudylistService.createStudyItem(req.user!.id, req.body);
      ApiResponse.created(res, item, 'Study item created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await StudylistService.getStudyItemById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, item);
    } catch (error) {
      next(error);
    }
  }

  public static async listItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StudylistService.listStudyItems(
        req.user!.id,
        req.query as unknown as Parameters<typeof StudylistService.listStudyItems>[1],
      );
      ApiResponse.paginated(res, result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await StudylistService.updateStudyItem(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, item, 200, 'Study item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudylistService.deleteStudyItem(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Study item deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Resources

  public static async addResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = await StudylistService.addResource(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.created(res, resource, 'Study resource added successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = await StudylistService.updateResource(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, resource, 200, 'Study resource updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudylistService.deleteResource(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Study resource deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
