import { PurchaseRequestService } from './purchase-request.service.js';
const purchaseRequestService = new PurchaseRequestService();
export class PurchaseRequestController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
            const requests = await purchaseRequestService.getPurchaseRequests({
                search,
                status,
                startDate,
                endDate,
                branchId,
            });
            res.status(200).json({ status: 'success', data: requests });
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
            const request = await purchaseRequestService.getPurchaseRequestById(id);
            if (!request) {
                res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: request });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const { CustCode, TypeRequest, items } = req.body;
            const createdById = req.user?.id || 1;
            if (!CustCode || !TypeRequest || !items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({
                    status: 'fail',
                    message: 'CustCode, TypeRequest, and non-empty items array are required',
                });
                return;
            }
            const request = await purchaseRequestService.createPurchaseRequest(req.body, createdById);
            res.status(201).json({ status: 'success', data: request });
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
            const request = await purchaseRequestService.updatePurchaseRequest(id, req.body, updatedById);
            if (!request) {
                res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: request });
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
            const success = await purchaseRequestService.deletePurchaseRequest(id);
            if (!success) {
                res.status(404).json({ status: 'fail', message: 'Purchase request not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
