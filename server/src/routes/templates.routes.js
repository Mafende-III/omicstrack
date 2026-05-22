import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import {
  getActive,
  listVersions,
  getVersion,
  createVersion,
} from '../controllers/templates.controller.js';

const router = Router();

// Read active template (any authenticated user — used by workflow steps)
router.get('/:kind/active', authenticate, getActive);

// Editor-only management
router.get('/:kind/versions', authenticate, requireCapability('edit_forms'), listVersions);
router.get('/:kind/:id', authenticate, requireCapability('edit_forms'), getVersion);
router.post('/:kind', authenticate, requireCapability('edit_forms'), createVersion);

export default router;
