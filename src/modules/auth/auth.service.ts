import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, BadRequestError } from '../../utils/appError.js';
import redisClient from '../../config/redis.js';

interface TokenPayload {
  id: number;
  email: string;
  role: string; // 'admin' | 'user'
}

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_JWT = '7d';

/** Normalise PHP $2y$ bcrypt prefix to $2b$ so bcryptjs can verify it */
function normaliseBcryptHash(hash: string): string {
  if (hash.startsWith('$2y$')) {
    return '$2b$' + hash.slice(4);
  }
  return hash;
}

export class AuthService {
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  public static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL_JWT,
    });
  }

  /** Store refresh token in Redis with TTL */
  private static async storeRefreshToken(
    token: string,
    userId: number
  ): Promise<void> {
    try {
      await redisClient.setEx(
        `refreshToken:${token}`,
        REFRESH_TOKEN_TTL_SECONDS,
        String(userId)
      );
    } catch {
      // Redis unavailable — degrade gracefully (token still sent to client)
    }
  }

  /** Revoke a refresh token from Redis */
  private static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await redisClient.del(`refreshToken:${token}`);
    } catch {
      // Redis unavailable — ignore
    }
  }

  public async login(data: { email: string; password: string }) {
    if (!data.email || !data.password) {
      throw new BadRequestError('Email and password are required.');
    }

    const user = await prisma.users.findFirst({
      where: {
        Email: {
          equals: data.email,
          // SQL Server string comparison is case-insensitive by default
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.Active !== 'Y') {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // bcryptjs handles both $2a$ and $2b$; normalise PHP's $2y$ prefix
    const normalised = normaliseBcryptHash(user.password);
    const passwordValid = await bcrypt.compare(data.password, normalised);

    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const role = user.IsAdmin === 'Y' ? 'admin' : 'user';

    const payload: TokenPayload = {
      id: user.id,
      email: user.Email ?? data.email,
      role,
    };

    const accessToken = AuthService.generateAccessToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.storeRefreshToken(refreshToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName ?? '',
        role,
        code: user.Code,
        mobileNo: user.MobileNo,
        branchId: user.Branch_id,
        profileImg: user.ProfileImg,
        isAdmin: user.IsAdmin === 'Y',
      },
      accessToken,
      refreshToken,
    };
  }

  public async refresh(token: string) {
    if (!token) {
      throw new UnauthorizedError('Refresh token is missing.');
    }

    // Verify JWT signature first
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Refresh token is invalid or expired.');
    }

    // Check it's still tracked in Redis (not revoked)
    try {
      const stored = await redisClient.get(`refreshToken:${token}`);
      if (!stored) {
        throw new UnauthorizedError('Refresh token has been revoked.');
      }
    } catch (err) {
      // If it's our own UnauthorizedError, re-throw
      if ((err as any)?.statusCode === 401) throw err;
      // Redis down — allow the JWT verification alone to gate access
    }

    // Verify user still exists and is active
    const user = await prisma.users.findUnique({ where: { id: decoded.id } });
    if (!user || user.Active !== 'Y') {
      throw new UnauthorizedError('User is no longer active.');
    }

    const newPayload: TokenPayload = {
      id: user.id,
      email: user.Email ?? decoded.email,
      role: user.IsAdmin === 'Y' ? 'admin' : 'user',
    };

    const newAccessToken = AuthService.generateAccessToken(newPayload);
    const newRefreshToken = AuthService.generateRefreshToken(newPayload);

    // Rotate: revoke old, store new
    await AuthService.revokeRefreshToken(token);
    await AuthService.storeRefreshToken(newRefreshToken, user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  public async logout(
    accessToken: string | undefined,
    refreshToken: string | undefined
  ) {
    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }

    if (accessToken) {
      try {
        // Blacklist access token in Redis until its natural expiry (15 min)
        await redisClient.setEx(`blacklist:${accessToken}`, 15 * 60, 'true');
      } catch {
        // Redis down — ignore, token will naturally expire
      }
    }
  }

  public async me(userId: number) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found.');
    return {
      id: user.id,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName ?? '',
      role: user.IsAdmin === 'Y' ? 'admin' : 'user',
      code: user.Code,
      mobileNo: user.MobileNo,
      branchId: user.Branch_id,
      profileImg: user.ProfileImg,
      isAdmin: user.IsAdmin === 'Y',
    };
  }
}
