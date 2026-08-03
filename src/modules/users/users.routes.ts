import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';

const router = Router();
const controller = new UsersController();

// All routes require authentication
router.use(auth);

// GET /api/users           — list all users (accessible to authenticated users; controller enforces admin for full list)
router.get('/', controller.getAll);

// GET /api/users/:id       — get single user (admin or self)
router.get('/:id', controller.getById);

// PUT /api/users/:id       — update user (admin or self)
router.put('/:id', controller.update);

// POST /api/users/:id/avatar — upload profile image (admin or self)
router.post('/:id/avatar', upload.single('avatar'), controller.uploadAvatar);

export default router;
