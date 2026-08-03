import { ConfigService } from './config.service.js';
const configService = new ConfigService();
export class ConfigController {
    get = async (req, res, next) => {
        try {
            const config = await configService.getConfig();
            res.status(200).json({ status: 'success', data: { config } });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const config = await configService.updateConfig(req.body);
            res.status(200).json({ status: 'success', data: { config } });
        }
        catch (err) {
            next(err);
        }
    };
}
