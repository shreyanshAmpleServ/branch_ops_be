import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from './warehouse.service.js';

const warehouseService = new WarehouseService();

export class WarehouseController {
  /** GET /api/warehouse — list all warehouses */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const result = await warehouseService.getWarehouses({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string | undefined,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/warehouse/:id/items — get items in warehouse */
  public getItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await warehouseService.getWarehouseItems(Number(id));
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };
}
