import { Router } from 'express';
import { getShipments, getShipment, createShipment, receiveShipment, deleteShipment, getShippablePatients } from '../controllers/shipments.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { CreateShipmentSchema, ReceiveShipmentSchema } from '../validation/schemas.js';

const router = Router();

router.get('/shippable-patients', authenticate, requireCapability('create_shipment'), getShippablePatients);
// Both creators and receivers need to be able to read shipments
router.get('/', authenticate, requireCapability('create_shipment', 'receive_shipment'), getShipments);
router.get('/:id', authenticate, requireCapability('create_shipment', 'receive_shipment'), getShipment);
router.post('/', authenticate, requireCapability('create_shipment'), validate(CreateShipmentSchema), createShipment);
router.post('/:id/receive', authenticate, requireCapability('receive_shipment'), validate(ReceiveShipmentSchema), receiveShipment);
router.delete('/:id', authenticate, requireCapability('create_shipment'), deleteShipment);

export default router;
