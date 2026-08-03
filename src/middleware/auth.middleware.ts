import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/appError.js';
import redisClient from '../config/redis.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

interface DecodedToken {
  id: number;
  email: string;
  role: string;
}

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication token is missing.');
    }

    // Verify JWT signature and expiry
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token.');
    }

    // Check if token has been blacklisted (after logout)
    try {
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked.');
      }
    } catch (redisErr) {
      // If it's our own UnauthorizedError, re-throw
      if ((redisErr as any)?.statusCode === 401) throw redisErr;
      // Redis unavailable — degrade gracefully, skip blacklist check
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};
