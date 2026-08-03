import { ForbiddenError, UnauthorizedError } from '../utils/appError.js';
import { ROLE_PERMISSIONS } from '../config/constants.js';
export const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError('User authentication context is missing.');
        }
        const userRole = req.user.role;
        const permissions = ROLE_PERMISSIONS[userRole] || [];
        if (!permissions.includes(permission)) {
            throw new ForbiddenError('You do not have permission to access this resource.');
        }
        next();
    };
};
