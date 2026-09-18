import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ProjectsController();

// All routes require authentication
router.use(auth);

// GET /api/projects
router.get('/', controller.getAll);

// GET /api/projects/analytics
router.get('/analytics', controller.getAnalytics);

// GET /api/projects/finance
router.get('/finance', controller.getFinance);

// GET /api/projects/:id
router.get('/:id', controller.getById);

// POST /api/projects
router.post('/', controller.create);

// PUT /api/projects/:id
router.put('/:id', controller.update);

// DELETE /api/projects/:id
router.delete('/:id', controller.delete);

export default router;
