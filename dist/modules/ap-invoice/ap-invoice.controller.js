import { apInvoiceService } from './ap-invoice.service.js';
export class ApInvoiceController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
            const typeRequest = req.query.typeRequest;
            const invoices = await apInvoiceService.getApInvoices({
                search,
                status,
                startDate,
                endDate,
                branchId,
                typeRequest,
            });
            res.status(200).json({ status: 'success', data: invoices });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ status: 'fail', message: 'Invalid ID' });
                return;
            }
            const invoice = await apInvoiceService.getApInvoiceById(id);
            if (!invoice) {
                res.status(404).json({ status: 'fail', message: 'AP Invoice not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: invoice });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const { CustCode, items } = req.body;
            const createdById = req.user?.id || 1;
            if (!CustCode || !items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({
                    status: 'fail',
                    message: 'CustCode and non-empty items array are required',
                });
                return;
            }
            const invoice = await apInvoiceService.createApInvoice(req.body, createdById);
            res.status(201).json({ status: 'success', data: invoice });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ status: 'fail', message: 'Invalid ID' });
                return;
            }
            const updatedById = req.user?.id || 1;
            const invoice = await apInvoiceService.updateApInvoice(id, req.body, updatedById);
            if (!invoice) {
                res.status(404).json({ status: 'fail', message: 'AP Invoice not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: invoice });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ status: 'fail', message: 'Invalid ID' });
                return;
            }
            await apInvoiceService.deleteApInvoice(id);
            res.status(200).json({ status: 'success', message: 'AP Invoice deleted successfully' });
        }
        catch (err) {
            next(err);
        }
    };
}
export const apInvoiceController = new ApInvoiceController();
