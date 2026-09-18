import { PurchaseOrderService } from './purchase-order.service.js';
const purchaseOrderService = new PurchaseOrderService();
export class PurchaseOrderController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
            const typeRequest = req.query.typeRequest;
            const orders = await purchaseOrderService.getPurchaseOrders({
                search,
                status,
                startDate,
                endDate,
                branchId,
                typeRequest,
            });
            res.status(200).json({ status: 'success', data: orders });
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
            const order = await purchaseOrderService.getPurchaseOrderById(id);
            if (!order) {
                res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: order });
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
            const order = await purchaseOrderService.createPurchaseOrder(req.body, createdById);
            res.status(201).json({ status: 'success', data: order });
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
            const order = await purchaseOrderService.updatePurchaseOrder(id, req.body, updatedById);
            if (!order) {
                res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: order });
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
            const success = await purchaseOrderService.deletePurchaseOrder(id);
            if (!success) {
                res.status(404).json({ status: 'fail', message: 'Purchase order not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
