import { Request, Response, NextFunction } from 'express';
import { ShareService } from './share.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class ShareController {
  public static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await ShareService.getStatus(req.user!.id);
      ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }

  public static async enableShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ShareService.enableShare(req.user!.id);
      ApiResponse.success(res, result, 200, 'Share link activated');
    } catch (error) {
      next(error);
    }
  }

  public static async revokeShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ShareService.revokeShare(req.user!.id);
      ApiResponse.success(res, { revoked: true }, 200, 'Share link revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicWatchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ShareService.getPublicWatchList(req.params.token as string);
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
