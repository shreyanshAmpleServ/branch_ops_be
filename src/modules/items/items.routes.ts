import { Router } from 'express';
import { ItemsController } from './items.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ItemsController();

// All routes require authentication
router.use(auth);

// GET /api/items
router.get('/', controller.getAll);

// GET /api/items/categories
router.get('/categories', controller.getCategories);

// GET /api/items/:id
router.get('/:id', controller.getById);

// POST /api/items
router.post('/', controller.create);

// PUT /api/items/:id
router.put('/:id', controller.update);

// DELETE /api/items/:id
router.delete('/:id', controller.delete);

export default router;
