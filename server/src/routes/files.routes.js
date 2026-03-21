import { Router } from 'express';
import { upload, uploadFile, downloadFile } from '../controllers/files.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.post('/upload', authenticate, authorize('admin', 'entry'), upload.single('file'), uploadFile);
router.get('/:type/:patientId/:filename', authenticate, downloadFile);

export default router;
