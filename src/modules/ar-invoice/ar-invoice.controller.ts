import { Request, Response, NextFunction } from 'express';
import { ArInvoiceService } from './ar-invoice.service.js';

export class ArInvoiceController {
  private service: ArInvoiceService;

  constructor() {
    this.service = new ArInvoiceService();
  }

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, startDate, endDate, branchId } = req.query;
      const data = await this.service.getArInvoices({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        branchId: branchId ? Number(branchId) : undefined,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.getArInvoiceById(Number(id));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 1;
      const data = await this.service.createArInvoice(req.body, userId);
      res.status(201).json({ success: true, message: 'AR Invoice created successfully.', data });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 1;
      const data = await this.service.updateArInvoice(Number(id), req.body, userId);
      res.status(200).json({ success: true, message: 'AR Invoice updated successfully.', data });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.deleteArInvoice(Number(id));
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}
