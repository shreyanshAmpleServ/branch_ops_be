import { WarehouseService } from './warehouse.service.js';
const warehouseService = new WarehouseService();
export class WarehouseController {
    /** GET /api/warehouse — list all warehouses */
    getAll = async (req, res, next) => {
        try {
            const { page, limit, search } = req.query;
            const result = await warehouseService.getWarehouses({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                search: search,
            });
            res.status(200).json({
                status: 'success',
                ...result,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** GET /api/warehouse/:id/items — get items in warehouse */
    getItems = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await warehouseService.getWarehouseItems(Number(id));
            res.status(200).json({
                status: 'success',
                ...result,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
