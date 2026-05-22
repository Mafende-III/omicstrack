import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAttention, getActivity, getEnrollmentTrend } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/attention', authenticate, getAttention);
router.get('/activity', authenticate, getActivity);
router.get('/enrollment-trend', authenticate, getEnrollmentTrend);

export default router;
