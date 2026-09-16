import { Request, Response, NextFunction } from 'express';
import { PurchaseQuotationService } from './purchase-quotation.service.js';

const purchaseQuotationService = new PurchaseQuotationService();

export class PurchaseQuotationController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

      const quotations = await purchaseQuotationService.getPurchaseQuotations({
        search,
        status,
        startDate,
        endDate,
        branchId,
      });

      res.status(200).json({ status: 'success', data: quotations });
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

      const quotation = await purchaseQuotationService.getPurchaseQuotationById(id);
      if (!quotation) {
        res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: quotation });
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

      const quotation = await purchaseQuotationService.createPurchaseQuotation(req.body, createdById);
      res.status(201).json({ status: 'success', data: quotation });
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
      const quotation = await purchaseQuotationService.updatePurchaseQuotation(id, req.body, updatedById);

      if (!quotation) {
        res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: quotation });
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

      const success = await purchaseQuotationService.deletePurchaseQuotation(id);
      if (!success) {
        res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
