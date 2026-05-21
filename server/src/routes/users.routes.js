import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreateUserSchema, UpdateUserSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), getUsers);
router.post('/', authenticate, authorize('admin'), validate(CreateUserSchema), createUser);
router.put('/:id', authenticate, authorize('admin'), validate(UpdateUserSchema), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
