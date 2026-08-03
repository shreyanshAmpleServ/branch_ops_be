import { Request, Response, NextFunction } from 'express';
import { PurchaseRequestService } from './purchase-request.service.js';

const purchaseRequestService = new PurchaseRequestService();

export class PurchaseRequestController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const typeRequest = req.query.typeRequest as string;

      const requests = await purchaseRequestService.getPurchaseRequests({
        search,
        status,
        startDate,
        endDate,
        branchId,
        typeRequest,
      });

      res.status(200).json({ status: 'success', data: requests });
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

      const request = await purchaseRequestService.getPurchaseRequestById(id);
      if (!request) {
        res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: request });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { CustCode, TypeRequest, items } = req.body;
      const createdById = (req as any).user?.id || 1;

      if (!CustCode || !TypeRequest || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          status: 'fail',
          message: 'CustCode, TypeRequest, and non-empty items array are required',
        });
        return;
      }

      const request = await purchaseRequestService.createPurchaseRequest(req.body, createdById);
      res.status(201).json({ status: 'success', data: request });
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
      const request = await purchaseRequestService.updatePurchaseRequest(id, req.body, updatedById);

      if (!request) {
        res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: request });
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

      const success = await purchaseRequestService.deletePurchaseRequest(id);
      if (!success) {
        res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
