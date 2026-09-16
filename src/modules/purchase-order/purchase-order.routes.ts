import { Router } from 'express';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new PurchaseOrderController();

router.use(auth); // Require authentication for all purchase order endpoints

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
