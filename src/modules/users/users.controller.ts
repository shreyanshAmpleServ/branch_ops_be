import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { ForbiddenError, BadRequestError } from '../../utils/appError.js';

const usersService = new UsersService();

export class UsersController {
  /** GET /api/users — list all users (admin only) */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, active } = req.query;
      const result = await usersService.getUsers({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string | undefined,
        active: active as string | undefined,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/users/:id — get a single user (admin or self) */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      const requesterId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isAdmin && requesterId !== targetId) {
        throw new ForbiddenError('You can only view your own profile.');
      }

      const user = await usersService.getUserById(targetId);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/users/:id — update user (admin or self) */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      const requesterId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isAdmin && requesterId !== targetId) {
        throw new ForbiddenError('You can only edit your own profile.');
      }

      // Non-admins cannot toggle isAdmin or active status
      const data = { ...req.body };
      if (!isAdmin) {
        delete data.isAdmin;
        delete data.active;
      }

      const user = await usersService.updateUser(targetId, data);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/users/:id/avatar — upload profile image */
  public uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      const requesterId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isAdmin && requesterId !== targetId) {
        throw new ForbiddenError('You can only update your own avatar.');
      }

      if (!req.file) {
        throw new BadRequestError('No image file was uploaded.');
      }

      const user = await usersService.updateProfileImage(targetId, req.file.filename);
      res.status(200).json({
        status: 'success',
        data: {
          user,
          avatarPath: `/uploads/${req.file.filename}`,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
