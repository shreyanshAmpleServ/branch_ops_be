import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service.js';

const leadsService = new LeadsService();

export class LeadsController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leads = await leadsService.getLeads(req.user!.id);
      res.status(200).json({ status: 'success', results: leads.length, data: { leads } });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadsService.getLeadById(req.params.id as string, req.user!.id);
      res.status(200).json({ status: 'success', data: { lead } });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadsService.createLead(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { lead } });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadsService.updateLead(req.params.id as string, req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { lead } });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await leadsService.deleteLead(req.params.id as string, req.user!.id);
      res.status(204).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
