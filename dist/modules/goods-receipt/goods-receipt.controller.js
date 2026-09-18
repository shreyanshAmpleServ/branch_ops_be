import { GoodsReceiptService } from './goods-receipt.service.js';
const goodsReceiptService = new GoodsReceiptService();
export class GoodsReceiptController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
            const typeRequest = req.query.typeRequest;
            const receipts = await goodsReceiptService.getGoodsReceipts({
                search,
                status,
                startDate,
                endDate,
                branchId,
                typeRequest,
            });
            res.status(200).json({ status: 'success', data: receipts });
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
            const receipt = await goodsReceiptService.getGoodsReceiptById(id);
            if (!receipt) {
                res.status(404).json({ status: 'fail', message: 'Goods Receipt Purchase Order not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: receipt });
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
            const receipt = await goodsReceiptService.createGoodsReceipt(req.body, createdById);
            res.status(201).json({ status: 'success', data: receipt });
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
            const receipt = await goodsReceiptService.updateGoodsReceipt(id, req.body, updatedById);
            if (!receipt) {
                res.status(404).json({ status: 'fail', message: 'Goods Receipt Purchase Order not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: receipt });
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
            const result = await goodsReceiptService.deleteGoodsReceipt(id);
            res.status(200).json({ status: 'success', data: result });
        }
        catch (err) {
            next(err);
        }
    };
}
