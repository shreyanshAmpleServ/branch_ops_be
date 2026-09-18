import { QuotationsService } from './quotations.service.js';
export class QuotationsController {
    service;
    constructor() {
        this.service = new QuotationsService();
    }
    getAll = async (req, res, next) => {
        try {
            const { search, status, startDate, endDate, branchId } = req.query;
            const data = await this.service.getQuotations({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
                branchId: branchId ? Number(branchId) : undefined,
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.getQuotationById(Number(id));
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const userId = req.user?.id || 1;
            const data = await this.service.createQuotation(req.body, userId);
            res.status(201).json({ success: true, message: 'Sales Quotation created successfully.', data });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 1;
            const data = await this.service.updateQuotation(Number(id), req.body, userId);
            res.status(200).json({ success: true, message: 'Sales Quotation updated successfully.', data });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.deleteQuotation(Number(id));
            res.status(200).json(data);
        }
        catch (err) {
            next(err);
        }
    };
}
