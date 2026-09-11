import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import pc from 'picocolors';
import { AppError } from '../common/errors/app-error.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] as string;
  const isDev = env.NODE_ENV !== 'production';

  // 1. Handled AppError
  if (err instanceof AppError) {
    if (isDev) {
      const detailsStr = err.details ? ` | ${JSON.stringify(err.details)}` : '';
      logger.warn(
        `${pc.yellow('⚠️  [' + err.statusCode + ' ' + err.code + ']')} ${err.message}${pc.dim(detailsStr)}`,
      );
    } else {
      logger.warn({
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        requestId,
        method: req.method,
        path: req.originalUrl,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));

    if (isDev) {
      const summary = formattedErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      logger.warn(
        `${pc.yellow('⚠️  [400 VALIDATION_ERROR]')} Request validation failed: ${summary}`,
      );
    } else {
      logger.warn({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        requestId,
        errors: formattedErrors,
      });
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: formattedErrors,
      },
    });
    return;
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'field';

      if (isDev) {
        logger.warn(`${pc.yellow('⚠️  [409 CONFLICT]')} Unique constraint violation on ${target}`);
      }

      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${target} already exists.`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      if (isDev) {
        logger.warn(`${pc.yellow('⚠️  [404 NOT_FOUND]')} Prisma record not found`);
      }

      res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested record was not found.',
        },
      });
      return;
    }
  }

  // 4. Fallback Internal Server Error
  const errorObj = err instanceof Error ? err : new Error(String(err));
  if (isDev) {
    logger.error(
      `${pc.red(pc.bold('💥 [500 INTERNAL_SERVER_ERROR]'))} ${errorObj.message}\n${pc.red(errorObj.stack || '')}`,
    );
  } else {
    logger.error({
      message: errorObj.message,
      stack: errorObj.stack,
      requestId,
      method: req.method,
      path: req.originalUrl,
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : errorObj.message,
      ...(env.NODE_ENV !== 'production' && { stack: errorObj.stack }),
    },
  });
}

export default errorMiddleware;
