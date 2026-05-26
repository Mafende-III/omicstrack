import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { listNotes, createNote, deleteNote } from '../controllers/notes.controller.js';

const router = Router();

// All note routes require view_patients. Per-note delete enforces author / admin in the controller.
router.get('/:patientId/notes', authenticate, requireCapability('view_patients'), listNotes);
router.post('/:patientId/notes', authenticate, requireCapability('view_patients'), createNote);
router.delete('/:patientId/notes/:noteId', authenticate, requireCapability('view_patients'), deleteNote);

export default router;
