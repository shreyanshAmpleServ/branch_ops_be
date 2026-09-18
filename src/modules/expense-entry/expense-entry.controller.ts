import { Request, Response, NextFunction } from 'express';
import { ExpenseEntryService } from './expense-entry.service.js';

const expenseEntryService = new ExpenseEntryService();

export class ExpenseEntryController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const entries = await expenseEntryService.getEntries(search);
      res.status(200).json({ status: 'success', data: entries });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const entry = await expenseEntryService.getEntryById(id);
      if (!entry) {
        res.status(404).json({ status: 'fail', message: 'Expense entry not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: entry });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { expenseTypeId, amount, remarks } = req.body;
      const createdById = (req as any).user?.id || 1; // Pull logged-in user ID
      
      if (!expenseTypeId || amount === undefined) {
        res.status(400).json({ status: 'fail', message: 'expenseTypeId and amount are required' });
        return;
      }
      const entry = await expenseEntryService.createEntry(
        parseInt(expenseTypeId), 
        parseFloat(amount), 
        remarks, 
        createdById
      );
      res.status(201).json({ status: 'success', data: entry });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const entry = await expenseEntryService.updateEntry(id, req.body);
      if (!entry) {
        res.status(404).json({ status: 'fail', message: 'Expense entry not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: entry });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const success = await expenseEntryService.deleteEntry(id);
      if (!success) {
        res.status(404).json({ status: 'fail', message: 'Expense entry not found or delete failed' });
        return;
      }
      res.status(200).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
