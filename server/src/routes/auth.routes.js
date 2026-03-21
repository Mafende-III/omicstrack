import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { LoginSchema } from '../validation/schemas.js';

const router = Router();

router.post('/login', loginLimiter, validate(LoginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
