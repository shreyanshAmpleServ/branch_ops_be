import { Router } from 'express';
import { ExpenseEntryController } from './expense-entry.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
import { checkPermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();
const controller = new ExpenseEntryController();

router.use(auth);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create); // Any authenticated user can submit an expense entry
router.put('/:id', checkPermission(PERMISSIONS.USERS_MANAGE), controller.update);
router.delete('/:id', checkPermission(PERMISSIONS.USERS_MANAGE), controller.delete);

export default router;
