import { Router } from 'express';
import { GoodsReceiptController } from './goods-receipt.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new GoodsReceiptController();

router.use(auth); // Require authentication for all GRPO endpoints

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
