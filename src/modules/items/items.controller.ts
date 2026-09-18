import { Request, Response, NextFunction } from 'express';
import { ItemsService } from './items.service.js';

const itemsService = new ItemsService();

export class ItemsController {
  /** GET /api/items — list all items */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, catId, whsId, lowStock } = req.query;
      const result = await itemsService.getItems({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string | undefined,
        catId: catId ? Number(catId) : undefined,
        whsId: whsId ? Number(whsId) : undefined,
        lowStock: lowStock === 'true',
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/items/categories — list categories */
  public getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await itemsService.getCategories();
      res.status(200).json({
        status: 'success',
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/items/:id — get single item */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const item = await itemsService.getItemById(id);
      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/items — create item */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.createItem(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Item created successfully',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/items/:id — update item */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const item = await itemsService.updateItem(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Item updated successfully',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /api/items/:id — delete item */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const result = await itemsService.deleteItem(id);
      res.status(200).json({
        status: 'success',
        message: 'Item deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
