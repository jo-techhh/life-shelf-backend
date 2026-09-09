import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 LifeShelf API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📖 API documentation available at http://localhost:${env.PORT}/api/docs`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EACCES') {
    logger.error(`Port ${env.PORT} requires elevated permissions or is excluded by Windows NAT/Hyper-V.`);
    logger.error(`Please specify a different PORT in your .env file (e.g. PORT=5050 or PORT=8000).`);
  } else if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${env.PORT} is already in use by another process. Please choose a different port in .env.`);
  } else {
    logger.error(`Failed to start server: ${err.message}`);
  }
  process.exit(1);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
