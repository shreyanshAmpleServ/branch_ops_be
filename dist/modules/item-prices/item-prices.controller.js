import { ItemPricesService } from './item-prices.service.js';
const itemPricesService = new ItemPricesService();
export class ItemPricesController {
    async getPriceLists(req, res) {
        try {
            const priceLists = await itemPricesService.getPriceLists();
            return res.json({ status: 'success', data: priceLists });
        }
        catch (err) {
            return res.status(500).json({ status: 'error', message: err.message });
        }
    }
    async createPriceList(req, res) {
        try {
            const priceList = await itemPricesService.createPriceList(req.body);
            return res.status(201).json({ status: 'success', data: priceList });
        }
        catch (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }
    async getItemPrices(req, res) {
        try {
            const { page, limit, search, priceListId, catId, whsId } = req.query;
            const result = await itemPricesService.getItemPrices({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                search: search ? String(search) : undefined,
                priceListId: priceListId ? Number(priceListId) : undefined,
                catId: catId ? Number(catId) : undefined,
                whsId: whsId ? Number(whsId) : undefined,
            });
            return res.json({ status: 'success', ...result });
        }
        catch (err) {
            return res.status(500).json({ status: 'error', message: err.message });
        }
    }
    async upsertItemPrice(req, res) {
        try {
            const { priceListId, itemId, price, currency } = req.body;
            if (!priceListId || !itemId || price === undefined) {
                return res.status(400).json({ status: 'error', message: 'priceListId, itemId, and price are required' });
            }
            const updated = await itemPricesService.upsertItemPrice({
                priceListId: Number(priceListId),
                itemId: Number(itemId),
                price: Number(price),
                currency: currency ? String(currency) : undefined,
            });
            return res.json({ status: 'success', data: updated });
        }
        catch (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }
    async bulkUpdatePrices(req, res) {
        try {
            const { priceListId, updates } = req.body;
            if (!priceListId || !Array.isArray(updates)) {
                return res.status(400).json({ status: 'error', message: 'priceListId and updates array are required' });
            }
            const result = await itemPricesService.bulkUpdatePrices({
                priceListId: Number(priceListId),
                updates,
            });
            return res.json({ status: 'success', ...result });
        }
        catch (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }
}
