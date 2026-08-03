import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const authService = new AuthService();

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export class AuthController {
  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body
      );
      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        status: 'success',
        data: { user, accessToken },
      });
    } catch (err) {
      next(err);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.refreshToken || req.body?.refreshToken;
      const { accessToken, refreshToken } = await authService.refresh(token);
      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        status: 'success',
        data: { accessToken },
      });
    } catch (err) {
      next(err);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken =
        req.cookies?.accessToken ||
        req.headers.authorization?.split(' ')[1];
      const refreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

      await authService.logout(accessToken, refreshToken);
      clearCookies(res);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  /** Returns the authenticated user's profile */
  public me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.me(req.user!.id as unknown as number);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  };
}
