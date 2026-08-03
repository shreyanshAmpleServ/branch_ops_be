import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { loginSchema } from './auth.validation.js';
import { authLimiter } from '../../middleware/rateLimit.middleware.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
const controller = new AuthController();
// Rate-limited login
router.post('/login', authLimiter, validate(loginSchema), controller.login);
// Token rotation (no rate limit — called automatically by frontend)
router.post('/refresh', controller.refresh);
// Logout — revokes tokens
router.post('/logout', controller.logout);
// Get current user profile (protected)
router.get('/me', auth, controller.me);
export default router;
