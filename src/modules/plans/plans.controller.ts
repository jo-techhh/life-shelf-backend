import { Request, Response, NextFunction } from 'express';
import { PlansService } from './plans.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class PlansController {
  public static async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlansService.createPlan(req.user!.id, req.body);
      ApiResponse.created(res, plan, 'Plan created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlansService.getPlanById(req.user!.id, req.params.id as string);
      ApiResponse.success(res, plan);
    } catch (error) {
      next(error);
    }
  }

  public static async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PlansService.listPlans(
        req.user!.id,
        req.query as unknown as Parameters<typeof PlansService.listPlans>[1],
      );
      ApiResponse.paginated(res, result.plans, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlansService.updatePlan(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      ApiResponse.success(res, plan, 200, 'Plan updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PlansService.deletePlan(req.user!.id, req.params.id as string);
      ApiResponse.success(res, { deleted: true }, 200, 'Plan deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
