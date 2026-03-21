import { Router } from 'express';
import { getShipments, getShipment, createShipment, receiveShipment, deleteShipment, getShippablePatients } from '../controllers/shipments.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreateShipmentSchema, ReceiveShipmentSchema } from '../validation/schemas.js';

const router = Router();

router.get('/shippable-patients', authenticate, authorize('admin', 'entry'), getShippablePatients);
router.get('/', authenticate, authorize('admin', 'entry', 'liege'), getShipments);
router.get('/:id', authenticate, authorize('admin', 'entry', 'liege'), getShipment);
router.post('/', authenticate, authorize('admin', 'entry'), validate(CreateShipmentSchema), createShipment);
router.post('/:id/receive', authenticate, authorize('admin', 'liege'), validate(ReceiveShipmentSchema), receiveShipment);
router.delete('/:id', authenticate, authorize('admin'), deleteShipment);

export default router;
