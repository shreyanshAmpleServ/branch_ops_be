import { Router } from 'express';
import { ContactsController } from './contacts.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
import { checkPermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createContactSchema, updateContactSchema, getContactByIdSchema } from './contacts.validation.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();
const controller = new ContactsController();

router.use(auth);

router.get('/', checkPermission(PERMISSIONS.CONTACTS_VIEW), controller.getAll);
router.get('/:id', checkPermission(PERMISSIONS.CONTACTS_VIEW), validate(getContactByIdSchema), controller.getById);
router.post('/', checkPermission(PERMISSIONS.CONTACTS_CREATE), validate(createContactSchema), controller.create);
router.put('/:id', checkPermission(PERMISSIONS.CONTACTS_EDIT), validate(updateContactSchema), controller.update);
router.delete('/:id', checkPermission(PERMISSIONS.CONTACTS_DELETE), validate(getContactByIdSchema), controller.delete);

export default router;
