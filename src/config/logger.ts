import winston from 'winston';

const sensitiveKeys = [
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
];

const redactSensitiveData = winston.format((info) => {
  const maskObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        copy[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        copy[key] = maskObject(value as Record<string, unknown>);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  };

  if (typeof info === 'object' && info !== null) {
    return maskObject(info as unknown as Record<string, unknown>) as winston.Logform.TransformableInfo;
  }
  return info;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactSensitiveData(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'lifeshelf-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaString}`;
        }),
      ),
    }),
  ],
});

export default logger;
