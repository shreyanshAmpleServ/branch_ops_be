import { Request, Response, NextFunction } from 'express';
import { DealsService } from './deals.service.js';

const dealsService = new DealsService();

export class DealsController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deals = await dealsService.getDeals(String(req.user!.id));
      res.status(200).json({ status: 'success', results: deals.length, data: { deals } });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deal = await dealsService.getDealById(req.params.id as string, String(req.user!.id));
      res.status(200).json({ status: 'success', data: { deal } });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deal = await dealsService.createDeal(req.body, String(req.user!.id));
      res.status(201).json({ status: 'success', data: { deal } });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deal = await dealsService.updateDeal(req.params.id as string, req.body, String(req.user!.id));
      res.status(200).json({ status: 'success', data: { deal } });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await dealsService.deleteDeal(req.params.id as string, String(req.user!.id));
      res.status(204).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
