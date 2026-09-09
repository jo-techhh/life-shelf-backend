import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200, message?: string): Response {
    return res.status(statusCode).json({
      success: true,
      ...(message && { message }),
      data,
    });
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.success(res, data, 201, message);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    statusCode = 200,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      pagination,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
