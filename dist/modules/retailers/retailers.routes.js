import { Router } from 'express';
import { RetailersController } from './retailers.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
const controller = new RetailersController();
// Protect all routes
router.use(auth);
// Main collection routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.put('/:id/approve', controller.approve);
router.delete('/:id', controller.delete);
// Sub-tab details routes using Retailer Code
router.get('/:code/orders', controller.getOrders);
router.get('/:code/notes', controller.getNotes);
router.get('/:code/complaints', controller.getComplaints);
export default router;
