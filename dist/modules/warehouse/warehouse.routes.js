import { Router } from 'express';
import { WarehouseController } from './warehouse.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
const controller = new WarehouseController();
// All routes require authentication
router.use(auth);
// GET /api/warehouse
router.get('/', controller.getAll);
// GET /api/warehouse/:id/items
router.get('/:id/items', controller.getItems);
export default router;
