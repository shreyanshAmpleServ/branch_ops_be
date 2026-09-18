import { LeadsService } from './leads.service.js';
const leadsService = new LeadsService();
export class LeadsController {
    getAll = async (req, res, next) => {
        try {
            const leads = await leadsService.getLeads(String(req.user.id));
            res.status(200).json({ status: 'success', results: leads.length, data: { leads } });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const lead = await leadsService.getLeadById(req.params.id, String(req.user.id));
            res.status(200).json({ status: 'success', data: { lead } });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const lead = await leadsService.createLead(req.body, String(req.user.id));
            res.status(201).json({ status: 'success', data: { lead } });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const lead = await leadsService.updateLead(req.params.id, req.body, String(req.user.id));
            res.status(200).json({ status: 'success', data: { lead } });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            await leadsService.deleteLead(req.params.id, String(req.user.id));
            res.status(204).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
