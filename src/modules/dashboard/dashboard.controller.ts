import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class DashboardController {
  public static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await DashboardService.getDashboardData(req.user!.id);
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
