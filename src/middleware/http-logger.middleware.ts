import { Request, Response, NextFunction } from 'express';
import pc from 'picocolors';
import { logger, redactSensitiveDataFromObject } from '../config/logger.js';
import { env } from '../config/env.js';

// Standard HTTP status text mapping
const STATUS_TEXTS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

function formatMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return pc.cyan(pc.bold('GET'));
    case 'POST':
      return pc.green(pc.bold('POST'));
    case 'PUT':
      return pc.yellow(pc.bold('PUT'));
    case 'PATCH':
      return pc.magenta(pc.bold('PATCH'));
    case 'DELETE':
      return pc.red(pc.bold('DELETE'));
    case 'OPTIONS':
    case 'HEAD':
      return pc.dim(method.toUpperCase());
    default:
      return pc.bold(method.toUpperCase());
  }
}

function formatStatus(statusCode: number, statusMessage?: string): string {
  const text = statusMessage || STATUS_TEXTS[statusCode] || '';
  const fullStatus = text ? `${statusCode} ${text}` : `${statusCode}`;

  if (statusCode >= 500) {
    return pc.red(pc.bold(fullStatus));
  }
  if (statusCode >= 400) {
    return pc.yellow(pc.bold(fullStatus));
  }
  if (statusCode >= 300) {
    return pc.cyan(fullStatus);
  }
  return pc.green(pc.bold(fullStatus));
}

function formatDuration(ms: number): string {
  const formatted = ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1000) {
    return pc.red(formatted);
  }
  if (ms >= 300) {
    return pc.yellow(formatted);
  }
  return pc.dim(formatted);
}

function cleanClientIp(req: Request): string {
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  return rawIp.replace(/^::ffff:/, '');
}

/**
 * FastAPI / Django styled HTTP request logging middleware
 */
export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip logging during test execution unless explicitly desired
  if (env.NODE_ENV === 'test') {
    return next();
  }

  const startTime = performance.now();
  const clientIp = cleanClientIp(req);
  const httpVersion = `HTTP/${req.httpVersion}`;
  const requestId = req.headers['x-request-id'] as string;

  // Easy Debugging in development: Log incoming request details
  const isDev = env.NODE_ENV === 'development';
  if (isDev && req.path !== '/api/health') {
    const hasQuery = req.query && Object.keys(req.query).length > 0;
    const hasBody =
      req.body &&
      typeof req.body === 'object' &&
      !Array.isArray(req.body) &&
      Object.keys(req.body).length > 0;

    if (hasQuery || hasBody) {
      const debugParts: string[] = [];
      if (hasQuery) {
        debugParts.push(`↳ Query: ${JSON.stringify(req.query)}`);
      }
      if (hasBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const sanitizedBody = redactSensitiveDataFromObject(req.body);
        debugParts.push(`↳ Body: ${JSON.stringify(sanitizedBody)}`);
      }

      if (debugParts.length > 0) {
        logger.debug(
          `${pc.cyan('📥')} ${formatMethod(req.method)} ${pc.underline(req.originalUrl || req.url)}\n    ${pc.dim(debugParts.join('\n    '))}`,
        );
      }
    }
  }

  // Hook into response finish event
  res.on('finish', () => {
    // Optionally skip health check in noisy logs if desired, or keep it concise
    const duration = performance.now() - startTime;
    const statusCode = res.statusCode;

    if (env.NODE_ENV === 'production') {
      // Production: structured JSON logging
      const logData = {
        message: `${req.method} ${req.originalUrl} ${statusCode} - ${duration.toFixed(1)}ms`,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        durationMs: Number(duration.toFixed(1)),
        clientIp,
        requestId,
      };

      if (statusCode >= 500) {
        logger.error(logData);
      } else if (statusCode >= 400) {
        logger.warn(logData);
      } else {
        logger.info(logData);
      }
      return;
    }

    // Development & Staging: FastAPI / Uvicorn & Django style terminal log
    // Example: INFO:     127.0.0.1 - "GET /api/movies HTTP/1.1" 200 OK - 14.2ms
    const methodFormatted = formatMethod(req.method);
    const statusFormatted = formatStatus(statusCode, res.statusMessage);
    const durationFormatted = formatDuration(duration);
    const reqIdTag = requestId ? pc.dim(` [req:${requestId.slice(0, 8)}]`) : '';

    const logLine = `${pc.dim(clientIp)} - "${methodFormatted} ${req.originalUrl || req.url} ${pc.dim(httpVersion)}" ${statusFormatted} - ${durationFormatted}${reqIdTag}`;

    if (statusCode >= 500) {
      logger.error(logLine);
    } else if (statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.info(logLine);
    }
  });

  next();
}

export default httpLoggerMiddleware;
