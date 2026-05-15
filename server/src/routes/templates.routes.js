import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import {
  getActive,
  listVersions,
  getVersion,
  createVersion,
} from '../controllers/templates.controller.js';

const router = Router();

// Read active template (any authenticated user — used by workflow steps)
router.get('/:kind/active', authenticate, getActive);

// Admin-only management
router.get('/:kind/versions', authenticate, authorize('admin'), listVersions);
router.get('/:kind/:id', authenticate, authorize('admin'), getVersion);
router.post('/:kind', authenticate, authorize('admin'), createVersion);

export default router;
