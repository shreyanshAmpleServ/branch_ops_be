import { Router } from 'express';
import { apInvoiceController } from './ap-invoice.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
router.use(auth); // Require authentication for all AP Invoice endpoints
router.get('/', apInvoiceController.getAll);
router.get('/:id', apInvoiceController.getById);
router.post('/', apInvoiceController.create);
router.put('/:id', apInvoiceController.update);
router.delete('/:id', apInvoiceController.delete);
export default router;
