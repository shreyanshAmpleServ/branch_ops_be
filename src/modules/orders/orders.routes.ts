import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new OrdersController();

router.use(auth);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
