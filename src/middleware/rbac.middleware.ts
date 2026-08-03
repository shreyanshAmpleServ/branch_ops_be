import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/appError.js';
import { ROLE_PERMISSIONS, PermissionType, RoleType } from '../config/constants.js';

export const checkPermission = (permission: PermissionType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication context is missing.');
    }

    const userRole = req.user.role as RoleType;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes(permission)) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }

    next();
  };
};
