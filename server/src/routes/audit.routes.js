import { Router } from 'express';
import { getAuditLog, getAuditForEntity } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), getAuditLog);
router.get('/entity/:entityId', authenticate, authorize('admin'), getAuditForEntity);

export default router;
