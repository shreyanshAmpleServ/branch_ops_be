import { Request, Response, NextFunction } from 'express';
import { GoodsReceiptService } from './goods-receipt.service.js';

const goodsReceiptService = new GoodsReceiptService();

export class GoodsReceiptController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const typeRequest = req.query.typeRequest as string;

      const receipts = await goodsReceiptService.getGoodsReceipts({
        search,
        status,
        startDate,
        endDate,
        branchId,
        typeRequest,
      });

      res.status(200).json({ status: 'success', data: receipts });
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

      const receipt = await goodsReceiptService.getGoodsReceiptById(id);
      if (!receipt) {
        res.status(404).json({ status: 'fail', message: 'Goods Receipt Purchase Order not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: receipt });
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

      const receipt = await goodsReceiptService.createGoodsReceipt(req.body, createdById);
      res.status(201).json({ status: 'success', data: receipt });
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
      const receipt = await goodsReceiptService.updateGoodsReceipt(id, req.body, updatedById);

      if (!receipt) {
        res.status(404).json({ status: 'fail', message: 'Goods Receipt Purchase Order not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: receipt });
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

      const result = await goodsReceiptService.deleteGoodsReceipt(id);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };
}
