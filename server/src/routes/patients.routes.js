import { Router } from 'express';
import { getPatients, getPatient, createPatient, updatePatient, getDashboardStats } from '../controllers/patients.controller.js';
import { authenticate } from '../middleware/auth.js';
import { applySiteFilter, requireCapability } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreatePatientSchema, UpdatePatientSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, requireCapability('view_patients'), applySiteFilter, getPatients);
router.get('/dashboard/stats', authenticate, applySiteFilter, getDashboardStats);
router.get('/:id', authenticate, requireCapability('view_patients'), getPatient);
router.post('/', authenticate, requireCapability('add_patient'), validate(CreatePatientSchema), createPatient);
router.put('/:id', authenticate, requireCapability('edit_patient'), validate(UpdatePatientSchema), updatePatient);

export default router;
