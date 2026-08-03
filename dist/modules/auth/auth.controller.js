import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';
const authService = new AuthService();
const setCookies = (res, accessToken, refreshToken) => {
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
const clearCookies = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};
export class AuthController {
    login = async (req, res, next) => {
        try {
            const { user, accessToken, refreshToken } = await authService.login(req.body);
            setCookies(res, accessToken, refreshToken);
            res.status(200).json({
                status: 'success',
                data: { user, accessToken },
            });
        }
        catch (err) {
            next(err);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            const { accessToken, refreshToken } = await authService.refresh(token);
            setCookies(res, accessToken, refreshToken);
            res.status(200).json({
                status: 'success',
                data: { accessToken },
            });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const accessToken = req.cookies?.accessToken ||
                req.headers.authorization?.split(' ')[1];
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            await authService.logout(accessToken, refreshToken);
            clearCookies(res);
            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** Returns the authenticated user's profile */
    me = async (req, res, next) => {
        try {
            const user = await authService.me(req.user.id);
            res.status(200).json({
                status: 'success',
                data: { user },
            });
        }
        catch (err) {
            next(err);
        }
    };
}
