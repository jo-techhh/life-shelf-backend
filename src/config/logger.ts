import winston from 'winston';
import pc from 'picocolors';

export const sensitiveKeys = [
  'password',
  'passwordHash',
  'token',
  'jwt',
  'apiSecret',
  'encryptedApiSecret',
  'apiKey',
  'encryptionKey',
  'secret',
  'authorization',
  'accessToken',
  'refreshToken',
  'cookie',
];

export function redactSensitiveDataFromObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveDataFromObject);
  }
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      copy[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      copy[key] = redactSensitiveDataFromObject(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

const redactSensitiveData = winston.format((info) => {
  if (typeof info === 'object' && info !== null) {
    return redactSensitiveDataFromObject(info) as winston.Logform.TransformableInfo;
  }
  return info;
});

// FastAPI / Uvicorn style level formatting
export function formatLogLevel(level: string): string {
  const upper = level.toUpperCase();
  switch (upper) {
    case 'INFO':
      return pc.green(pc.bold('INFO:    '));
    case 'WARN':
    case 'WARNING':
      return pc.yellow(pc.bold('WARNING: '));
    case 'ERROR':
      return pc.red(pc.bold('ERROR:   '));
    case 'DEBUG':
      return pc.cyan(pc.bold('DEBUG:   '));
    case 'HTTP':
      return pc.magenta(pc.bold('HTTP:    '));
    default:
      return pc.bold(`${upper.padEnd(8)}: `);
  }
}

// Development console formatter (FastAPI / Django style)
const devConsoleFormat = winston.format.printf((info) => {
  const { level, message, timestamp, stack, ...meta } = info;
  const levelStr = formatLogLevel(level);

  const timeStr = timestamp
    ? pc.dim(`[${new Date(timestamp as string).toLocaleTimeString()}] `)
    : '';

  let out = `${timeStr}${levelStr}${message}`;

  if (stack) {
    out += `\n${pc.red(String(stack))}`;
  }

  const cleanMeta = { ...meta };
  delete cleanMeta.service;

  const extraKeys = Object.keys(cleanMeta);
  if (extraKeys.length > 0) {
    try {
      const formatted = JSON.stringify(cleanMeta, null, 2)
        .split('\n')
        .map((line) => `    ${pc.dim(line)}`)
        .join('\n');
      out += `\n${formatted}`;
    } catch {
      // ignore circular json
    }
  }

  return out;
});

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    redactSensitiveData(),
    isProduction
      ? winston.format.json()
      : winston.format.combine(winston.format.splat(), devConsoleFormat),
  ),
  defaultMeta: { service: 'lifeshelf-api' },
  transports: [new winston.transports.Console()],
});

export default logger;
