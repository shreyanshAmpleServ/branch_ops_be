import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from './purchase-order.service.js';

const purchaseOrderService = new PurchaseOrderService();

export class PurchaseOrderController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const typeRequest = req.query.typeRequest as string;

      const orders = await purchaseOrderService.getPurchaseOrders({
        search,
        status,
        startDate,
        endDate,
        branchId,
        typeRequest,
      });

      res.status(200).json({ status: 'success', data: orders });
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

      const order = await purchaseOrderService.getPurchaseOrderById(id);
      if (!order) {
        res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: order });
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

      const order = await purchaseOrderService.createPurchaseOrder(req.body, createdById);
      res.status(201).json({ status: 'success', data: order });
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
      const order = await purchaseOrderService.updatePurchaseOrder(id, req.body, updatedById);

      if (!order) {
        res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: order });
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

      const success = await purchaseOrderService.deletePurchaseOrder(id);
      if (!success) {
        res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
