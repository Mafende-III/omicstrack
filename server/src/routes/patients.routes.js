import { Router } from 'express';
import { getPatients, getPatient, createPatient, updatePatient, getDashboardStats } from '../controllers/patients.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, applySiteFilter } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreatePatientSchema, UpdatePatientSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, applySiteFilter, getPatients);
router.get('/dashboard/stats', authenticate, applySiteFilter, getDashboardStats);
router.get('/:id', authenticate, getPatient);
router.post('/', authenticate, authorize('admin', 'entry'), validate(CreatePatientSchema), createPatient);
router.put('/:id', authenticate, authorize('admin', 'entry'), validate(UpdatePatientSchema), updatePatient);

export default router;
