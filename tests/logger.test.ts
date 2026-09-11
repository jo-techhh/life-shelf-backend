import { describe, it, expect } from 'vitest';
import { redactSensitiveDataFromObject, formatLogLevel } from '../src/config/logger.js';

describe('FastAPI/Django Logger & Sanitization', () => {
  it('should redact sensitive keys like passwords, tokens, secrets', () => {
    const rawData = {
      email: 'user@example.com',
      password: 'superSecretPassword123',
      token: 'jwt.token.here',
      nested: {
        apiKey: 'sk-123456789',
        normalField: 'all-good',
      },
    };

    const redacted = redactSensitiveDataFromObject(rawData) as Record<string, unknown>;

    expect(redacted.email).toBe('user@example.com');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).normalField).toBe('all-good');
  });

  it('should format log levels with FastAPI / Django style prefixes', () => {
    expect(formatLogLevel('info')).toContain('INFO:');
    expect(formatLogLevel('warn')).toContain('WARNING:');
    expect(formatLogLevel('error')).toContain('ERROR:');
    expect(formatLogLevel('debug')).toContain('DEBUG:');
  });
});
