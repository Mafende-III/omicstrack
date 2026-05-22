import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreateUserSchema, UpdateUserSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, requireCapability('manage_users'), getUsers);
router.post('/', authenticate, requireCapability('manage_users'), validate(CreateUserSchema), createUser);
router.put('/:id', authenticate, requireCapability('manage_users'), validate(UpdateUserSchema), updateUser);
router.delete('/:id', authenticate, requireCapability('manage_users'), deleteUser);

export default router;
