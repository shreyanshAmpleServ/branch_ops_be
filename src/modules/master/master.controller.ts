import { Request, Response, NextFunction } from 'express';
import { MasterService } from './master.service.js';

const masterService = new MasterService();

export class MasterController {
  public getAreas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getAreas();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getWarehouses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getWarehouses();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getProjects();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getBranches();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getCostCenters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getCostCenters();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getCostCentersMain = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getCostCentersMain();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getAccounts();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getFreightCharges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getFreightCharges();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getExpenses();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getActivityTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getActivityTypes();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getActivityStatuses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getActivityStatuses();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getActivitySubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await masterService.getActivitySubjects();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };
}
