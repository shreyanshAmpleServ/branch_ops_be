import { ContactsService } from './contacts.service.js';
const contactsService = new ContactsService();
export class ContactsController {
    getAll = async (req, res, next) => {
        try {
            const contacts = await contactsService.getContacts(req.user.id);
            res.status(200).json({
                status: 'success',
                results: contacts.length,
                data: { contacts },
            });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const contact = await contactsService.getContactById(req.params.id, req.user.id);
            res.status(200).json({
                status: 'success',
                data: { contact },
            });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const contact = await contactsService.createContact(req.body, req.user.id);
            res.status(201).json({
                status: 'success',
                data: { contact },
            });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const contact = await contactsService.updateContact(req.params.id, req.body, req.user.id);
            res.status(200).json({
                status: 'success',
                data: { contact },
            });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            await contactsService.deleteContact(req.params.id, req.user.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
