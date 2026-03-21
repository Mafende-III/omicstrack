import { Router } from 'express';
import { getStep, saveStep, submitStep } from '../controllers/steps.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.get('/:patientId/:step', authenticate, getStep);
router.put('/:patientId/:step', authenticate, authorize('admin', 'entry'), saveStep);
router.post('/:patientId/:step/submit', authenticate, authorize('admin', 'entry'), submitStep);

export default router;
