import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      ApiResponse.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      ApiResponse.success(res, result, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    // JWT is stateless on client side; client clears token
    ApiResponse.success(res, { loggedOut: true }, 200, 'Logged out successfully');
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);
      const isConfigured = !!user.cloudStorageConfig?.isConfigured;
      ApiResponse.success(res, {
        ...user,
        user,
        cloudStorageConfigured: isConfigured,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthService.changePassword(req.user!.id, req.body);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await AuthService.updateProfile(req.user!.id, req.body);
      ApiResponse.success(res, user, 200, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
