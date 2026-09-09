import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { prisma } from '../src/config/database.js';
import { env } from '../src/config/env.js';

describe('AuthService — Registration, Login, Token & Password Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash passwords and create a new user with JWT token', async () => {
    const mockCreatedUser = {
      id: 'user-123',
      email: 'alex@example.com',
      username: 'alexdev',
      displayName: 'Alex',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValue(mockCreatedUser as any);

    const result = await AuthService.register({
      email: 'alex@example.com',
      username: 'alexdev',
      password: 'SecurePassword123!',
      displayName: 'Alex',
    });

    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('alex@example.com');
    expect(result.token).toBeDefined();

    // Verify token claims
    const decoded = jwt.verify(result.token, env.JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe('user-123');
  });

  it('should reject registration if email is already taken', async () => {
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'existing-1',
      email: 'alex@example.com',
      username: 'other',
    } as any);

    await expect(
      AuthService.register({
        email: 'alex@example.com',
        username: 'newname',
        password: 'Password123!',
      }),
    ).rejects.toThrow(/Email is already registered/);
  });

  it('should authenticate valid credentials and issue a signed JWT', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('CorrectPassword123!', salt);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'user-456',
      email: 'user@example.com',
      username: 'username456',
      passwordHash,
      displayName: 'Test User',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await AuthService.login({
      identifier: 'user@example.com',
      password: 'CorrectPassword123!',
    });

    expect(result.user.id).toBe('user-456');
    expect(result.token).toBeDefined();
  });

  it('should reject login if password does not match', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('CorrectPassword123!', salt);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'user-456',
      email: 'user@example.com',
      username: 'username456',
      passwordHash,
    } as any);

    await expect(
      AuthService.login({
        identifier: 'user@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(/Invalid credentials/);
  });
});
