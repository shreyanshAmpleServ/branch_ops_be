import { Request, Response, NextFunction } from 'express';
import { apInvoiceService } from './ap-invoice.service.js';

export class ApInvoiceController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const typeRequest = req.query.typeRequest as string;

      const invoices = await apInvoiceService.getApInvoices({
        search,
        status,
        startDate,
        endDate,
        branchId,
        typeRequest,
      });

      res.status(200).json({ status: 'success', data: invoices });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ status: 'fail', message: 'Invalid ID' });
        return;
      }

      const invoice = await apInvoiceService.getApInvoiceById(id);
      if (!invoice) {
        res.status(404).json({ status: 'fail', message: 'AP Invoice not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: invoice });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { CustCode, items } = req.body;
      const createdById = (req as any).user?.id || 1;

      if (!CustCode || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          status: 'fail',
          message: 'CustCode and non-empty items array are required',
        });
        return;
      }

      const invoice = await apInvoiceService.createApInvoice(req.body, createdById);
      res.status(201).json({ status: 'success', data: invoice });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ status: 'fail', message: 'Invalid ID' });
        return;
      }

      const updatedById = (req as any).user?.id || 1;
      const invoice = await apInvoiceService.updateApInvoice(id, req.body, updatedById);

      if (!invoice) {
        res.status(404).json({ status: 'fail', message: 'AP Invoice not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: invoice });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ status: 'fail', message: 'Invalid ID' });
        return;
      }

      await apInvoiceService.deleteApInvoice(id);
      res.status(200).json({ status: 'success', message: 'AP Invoice deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}

export const apInvoiceController = new ApInvoiceController();
