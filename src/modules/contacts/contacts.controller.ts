import { Request, Response, NextFunction } from 'express';
import { ContactsService } from './contacts.service.js';

const contactsService = new ContactsService();

export class ContactsController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contacts = await contactsService.getContacts(req.user!.id);
      res.status(200).json({
        status: 'success',
        results: contacts.length,
        data: { contacts },
      });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contact = await contactsService.getContactById(req.params.id as string, req.user!.id);
      res.status(200).json({
        status: 'success',
        data: { contact },
      });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contact = await contactsService.createContact(req.body, req.user!.id);
      res.status(201).json({
        status: 'success',
        data: { contact },
      });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contact = await contactsService.updateContact(req.params.id as string, req.body, req.user!.id);
      res.status(200).json({
        status: 'success',
        data: { contact },
      });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await contactsService.deleteContact(req.params.id as string, req.user!.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };
}
