import { Request, Response } from 'express';
import { ItemPricesService } from './item-prices.service.js';

const itemPricesService = new ItemPricesService();

export class ItemPricesController {
  public async getPriceLists(req: Request, res: Response) {
    try {
      const priceLists = await itemPricesService.getPriceLists();
      return res.json({ status: 'success', data: priceLists });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  public async createPriceList(req: Request, res: Response) {
    try {
      const priceList = await itemPricesService.createPriceList(req.body);
      return res.status(201).json({ status: 'success', data: priceList });
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  public async getItemPrices(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  public async upsertItemPrice(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }

  public async bulkUpdatePrices(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}
