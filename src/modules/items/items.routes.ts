import { Router } from 'express';
import { ItemsController } from './items.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ItemsController();

// All routes require authentication
router.use(auth);

// GET /api/items
router.get('/', controller.getAll);

export default router;
