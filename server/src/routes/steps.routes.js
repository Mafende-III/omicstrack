import { Router } from 'express';
import { getStep, saveStep, submitStep, downloadStepPdf, resetStep } from '../controllers/steps.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';

const router = Router();

router.get('/:patientId/:step', authenticate, getStep);

// Save & submit need the matching submit capability for the specific step.
// We dispatch per-step in middleware so each route stays a single registration.
function requireStepCapability(req, res, next) {
  const stepCapMap = {
    consent: 'submit_consent',
    questionnaire: 'submit_questionnaire',
    collection: 'submit_collection',
    pbmc: 'submit_pbmc',
  };
  const cap = stepCapMap[req.params.step];
  if (!cap) {
    return res.status(400).json({ error: 'Invalid step' });
  }
  const userCaps = req.user?.capabilities || [];
  if (!userCaps.includes(cap)) {
    return res.status(403).json({ error: 'Insufficient permissions', required: [cap] });
  }
  next();
}

router.put('/:patientId/:step', authenticate, requireStepCapability, saveStep);
router.post('/:patientId/:step/submit', authenticate, requireStepCapability, submitStep);
router.get('/:patientId/:step/pdf', authenticate, downloadStepPdf);

// Reset a step: needs edit_patient (the "fix mistakes" capability) AND the
// matching submit_<step> capability so we don't grant reset rights to users
// who couldn't have submitted the step in the first place.
router.delete(
  '/:patientId/:step',
  authenticate,
  requireCapability('edit_patient'),
  requireStepCapability,
  resetStep,
);

export default router;
