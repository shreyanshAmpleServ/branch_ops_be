import { DealsService } from './deals.service.js';
const dealsService = new DealsService();
export class DealsController {
    getAll = async (req, res, next) => {
        try {
            const deals = await dealsService.getDeals(req.user.id);
            res.status(200).json({ status: 'success', results: deals.length, data: { deals } });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const deal = await dealsService.getDealById(req.params.id, req.user.id);
            res.status(200).json({ status: 'success', data: { deal } });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const deal = await dealsService.createDeal(req.body, req.user.id);
            res.status(201).json({ status: 'success', data: { deal } });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const deal = await dealsService.updateDeal(req.params.id, req.body, req.user.id);
            res.status(200).json({ status: 'success', data: { deal } });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            await dealsService.deleteDeal(req.params.id, req.user.id);
            res.status(204).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
