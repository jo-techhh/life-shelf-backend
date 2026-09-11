import { PrismaClient } from '@prisma/client';
import pc from 'picocolors';
import { logger } from './logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const isDev = process.env.NODE_ENV === 'development';
// Enable SQL query logging if explicitly requested or by default in development (can be disabled via LOG_QUERIES=false)
const enableSqlLog =
  process.env.DEBUG_SQL === 'true' || (isDev && process.env.LOG_QUERIES !== 'false');

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: enableSqlLog
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : ['warn', 'error'],
  });

if (enableSqlLog && typeof (prisma as any).$on === 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: any) => {
    const duration = `${e.duration}ms`;
    const cleanQuery = typeof e.query === 'string' ? e.query.replace(/\s+/g, ' ').trim() : '';
    // Django / FastAPI SQL logger style
    logger.debug(
      `${pc.magenta(pc.bold('🗄️  prisma:query'))} ${pc.dim(cleanQuery)} ${pc.yellow(`[${duration}]`)}`,
    );
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
