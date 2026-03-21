import { Router } from 'express';
import { getUsers, createUser, deleteUser } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreateUserSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), getUsers);
router.post('/', authenticate, authorize('admin'), validate(CreateUserSchema), createUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
