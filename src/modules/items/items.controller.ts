import { Request, Response, NextFunction } from 'express';
import { ItemsService } from './items.service.js';

const itemsService = new ItemsService();

export class ItemsController {
  /** GET /api/items — list all items */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const result = await itemsService.getItems({
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
}
