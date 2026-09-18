import { Request, Response, NextFunction } from 'express';
import { BankingService } from './banking.service.js';

export class BankingController {
  private service: BankingService;

  constructor() {
    this.service = new BankingService();
  }

  /* --- Overview --- */
  public getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getBankingOverview();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /* --- Incoming Payments --- */
  public getIncomingPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, startDate, endDate } = req.query;
      const data = await this.service.getIncomingPayments({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getIncomingPaymentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.getIncomingPaymentById(Number(id));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public createIncomingPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 1;
      const data = await this.service.createIncomingPayment(req.body, userId);
      res.status(201).json({ success: true, message: 'Incoming Payment recorded successfully', data });
    } catch (err) {
      next(err);
    }
  };

  public deleteIncomingPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteIncomingPayment(Number(id));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public getAvailableInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerCode } = req.query;
      const data = await this.service.getAvailableInvoices(customerCode ? String(customerCode) : undefined);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /* --- Outgoing Payments --- */
  public getOutgoingPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, startDate, endDate } = req.query;
      const data = await this.service.getOutgoingPayments({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getOutgoingPaymentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.getOutgoingPaymentById(Number(id));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public createOutgoingPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 1;
      const data = await this.service.createOutgoingPayment(req.body, userId);
      res.status(201).json({ success: true, message: 'Outgoing Payment recorded successfully', data });
    } catch (err) {
      next(err);
    }
  };

  public deleteOutgoingPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteOutgoingPayment(Number(id));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /* --- Petty Cash --- */
  public getPettyCashAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPettyCashAccounts();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getPettyCashClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, category, startDate, endDate } = req.query;
      const data = await this.service.getPettyCashClaims({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        category: category ? String(category) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getPettyCashClaimById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.getPettyCashClaimById(Number(id));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public createPettyCashClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 1;
      const data = await this.service.createPettyCashClaim(req.body, userId);
      res.status(201).json({ success: true, message: 'Petty cash claim submitted successfully', data });
    } catch (err) {
      next(err);
    }
  };

  public disbursePettyCashClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { accountId } = req.body;
      const userId = (req as any).user?.id || 1;
      const data = await this.service.disbursePettyCashClaim(Number(id), Number(accountId), userId);
      res.status(200).json({ success: true, message: 'Petty cash disbursed successfully', data });
    } catch (err) {
      next(err);
    }
  };

  /* --- Pending PO Payments --- */
  public getPendingPoPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status } = req.query;
      const data = await this.service.getPendingPoPayments({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
