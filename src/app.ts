import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLoggerMiddleware } from './middleware/http-logger.middleware.js';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rate-limit.middleware.js';
import { NotFoundError } from './common/errors/app-error.js';

// Module routes
import authRoutes from './modules/auth/auth.routes.js';
import storageRoutes from './modules/storage/storage.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import tagsRoutes from './modules/tags/tags.routes.js';
import movieRoutes from './modules/movies/movie.routes.js';
import seriesRoutes from './modules/series/series.routes.js';
import seasonRoutes from './modules/series/season.routes.js';
import episodeRoutes from './modules/series/episode.routes.js';
import readlistRoutes from './modules/readlist/readlist.routes.js';
import studylistRoutes from './modules/studylist/studylist.routes.js';
import travelRoutes from './modules/travel/travel.routes.js';
import plansRoutes from './modules/plans/plans.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy headers (e.g. Render, Heroku, Nginx, Cloudflare)
  app.set('etag', false)
  app.set('trust proxy', 1);

  // Security middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.includes(',')
        ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : env.CORS_ORIGIN === '*'
          ? '*'
          : env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Correlation & JSON parsing
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging (FastAPI & Django style)
  app.use(httpLoggerMiddleware);

  // Rate Limiter
  app.use('/api', generalLimiter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'lifeshelf-backend',
    });
  });

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/storage', storageRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/tags', tagsRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/series', seriesRoutes);
  app.use('/api/seasons', seasonRoutes);
  app.use('/api/episodes', episodeRoutes);
  app.use('/api/readlist', readlistRoutes);
  app.use('/api/studylist', studylistRoutes);
  app.use('/api/travel', travelRoutes);
  app.use('/api/plans', plansRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // 404 handler
  app.use((req: Request) => {
    throw new NotFoundError(`Endpoint ${req.method} ${req.originalUrl}`);
  });

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}

export default createApp();
