import { Request, Response, NextFunction } from 'express';
import { ConfigService } from './config.service.js';

const configService = new ConfigService();

export class ConfigController {
  public get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await configService.getConfig();
      res.status(200).json({ status: 'success', data: { config } });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await configService.updateConfig(req.body);
      res.status(200).json({ status: 'success', data: { config } });
    } catch (err) {
      next(err);
    }
  };
}
