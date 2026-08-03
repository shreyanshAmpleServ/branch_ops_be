import { Router } from 'express';
import { WarehouseController } from './warehouse.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
const controller = new WarehouseController();
// All routes require authentication
router.use(auth);
// GET /api/warehouse
router.get('/', controller.getAll);
export default router;
