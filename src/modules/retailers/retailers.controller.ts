import { Request, Response, NextFunction } from 'express';
import { RetailersService } from './retailers.service.js';
import { BadRequestError } from '../../utils/appError.js';

const retailersService = new RetailersService();

export class RetailersController {
  /**
   * GET /api/retailers
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardType, search, aprStatus, startDate, endDate, page, limit } = req.query;

      if (!cardType || (cardType !== 'C' && cardType !== 'S')) {
        throw new BadRequestError('cardType query parameter must be either C or S');
      }

      const result = await retailersService.getRetailers({
        cardType: cardType as 'C' | 'S',
        search: search as string | undefined,
        aprStatus: aprStatus as 'Y' | 'N' | 'all' | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/retailers/:id
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError('Invalid retailer ID');
      }

      const retailer = await retailersService.getRetailerById(id);
      res.status(200).json({
        status: 'success',
        data: retailer,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/retailers/:id
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError('Invalid retailer ID');
      }

      const retailer = await retailersService.updateRetailer(id, req.body);
      res.status(200).json({
        status: 'success',
        data: retailer,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/retailers/:id/approve
   */
  public approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError('Invalid retailer ID');
      }

      const { aprStatus, remark } = req.body;
      if (!aprStatus || (aprStatus !== 'Y' && aprStatus !== 'N')) {
        throw new BadRequestError('aprStatus must be Y (Approve) or N (Reject)');
      }

      const approvedBy = req.user ? req.user.email : 'System';
      const retailer = await retailersService.approveRetailer(id, aprStatus, remark || '', approvedBy);

      res.status(200).json({
        status: 'success',
        data: retailer,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/retailers/:code/orders
   */
  public getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const orders = await retailersService.getRetailerOrders(code);
      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/retailers/:code/notes
   */
  public getNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const notes = await retailersService.getRetailerNotes(code);
      res.status(200).json({
        status: 'success',
        data: notes,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/retailers/:code/complaints
   */
  public getComplaints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const complaints = await retailersService.getRetailerComplaints(code);
      res.status(200).json({
        status: 'success',
        data: complaints,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/retailers/:id
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError('Invalid retailer ID');
      }

      await retailersService.deleteRetailer(id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };
}
