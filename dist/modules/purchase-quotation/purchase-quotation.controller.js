import { PurchaseQuotationService } from './purchase-quotation.service.js';
const purchaseQuotationService = new PurchaseQuotationService();
export class PurchaseQuotationController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
            const typeRequest = req.query.typeRequest;
            const quotations = await purchaseQuotationService.getPurchaseQuotations({
                search,
                status,
                startDate,
                endDate,
                branchId,
                typeRequest,
            });
            res.status(200).json({ status: 'success', data: quotations });
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
            const quotation = await purchaseQuotationService.getPurchaseQuotationById(id);
            if (!quotation) {
                res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: quotation });
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
            const quotation = await purchaseQuotationService.createPurchaseQuotation(req.body, createdById);
            res.status(201).json({ status: 'success', data: quotation });
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
            const quotation = await purchaseQuotationService.updatePurchaseQuotation(id, req.body, updatedById);
            if (!quotation) {
                res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: quotation });
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
            const success = await purchaseQuotationService.deletePurchaseQuotation(id);
            if (!success) {
                res.status(404).json({ status: 'fail', message: 'Purchase quotation not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
