import { Router } from 'express';
import { TasksController } from './tasks.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
import { checkPermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();
const controller = new TasksController();

router.use(auth);

router.get('/', checkPermission(PERMISSIONS.TASKS_VIEW), controller.getAll);
router.get('/:id', checkPermission(PERMISSIONS.TASKS_VIEW), controller.getById);
router.post('/', checkPermission(PERMISSIONS.TASKS_CREATE), controller.create);
router.put('/:id', checkPermission(PERMISSIONS.TASKS_EDIT), controller.update);
router.delete('/:id', checkPermission(PERMISSIONS.TASKS_DELETE), controller.delete);

export default router;
