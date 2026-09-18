import { prisma } from '../../config/db.js';
export class ItemPricesService {
    /** Get all available Price Lists */
    async getPriceLists() {
        const priceLists = await prisma.priceList.findMany({
            orderBy: { ID: 'asc' },
        });
        return priceLists.map(pl => ({
            id: pl.ID,
            code: pl.Code ?? `PL-${pl.ID}`,
            name: pl.Name,
            createdDate: pl.CreatedDate,
            priceType: pl.PriceType ?? 0,
        }));
    }
    /** Create a new Price List */
    async createPriceList(data) {
        const code = data.code?.trim() || `PL-${Date.now().toString().slice(-4)}`;
        const newPriceList = await prisma.priceList.create({
            data: {
                Code: code,
                Name: data.name.trim(),
                PriceType: data.priceType ?? 0,
            },
        });
        return {
            id: newPriceList.ID,
            code: newPriceList.Code,
            name: newPriceList.Name,
            priceType: newPriceList.PriceType,
            createdDate: newPriceList.CreatedDate,
        };
    }
    /** Paginated list directly from ItemPrices table */
    async getItemPrices(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 20));
        const skip = (page - 1) * limit;
        // Resolve price lists
        const priceLists = await this.getPriceLists();
        const activePriceListId = params.priceListId || (priceLists.length > 0 ? priceLists[0].id : null);
        const activePriceList = activePriceListId ? priceLists.find(p => p.id === activePriceListId) || priceLists[0] : null;
        // ItemPrices query filters
        const andConditions = [];
        if (activePriceListId) {
            andConditions.push({ PriceListID: activePriceListId });
        }
        if (params.search) {
            const s = params.search.trim();
            andConditions.push({
                OR: [
                    { Items: { Code: { contains: s } } },
                    { Items: { Name: { contains: s } } },
                    { Items: { UoM: { contains: s } } },
                    { Currency: { contains: s } },
                ],
            });
        }
        if (params.catId) {
            andConditions.push({ Items: { CatID: params.catId } });
        }
        if (params.whsId) {
            andConditions.push({
                OR: [
                    { Items: { DfltWhsID: params.whsId } },
                    { Items: { ItemWhs: { some: { WhsID: params.whsId } } } },
                ],
            });
        }
        const where = andConditions.length > 0 ? { AND: andConditions } : {};
        const [total, itemPricesList, categories, warehouses] = await Promise.all([
            prisma.itemPrices.count({ where }),
            prisma.itemPrices.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ID: 'desc' },
                include: {
                    Items: true,
                    PriceList: true,
                },
            }),
            prisma.iTMCategory.findMany({ select: { ID: true, Name: true } }),
            prisma.warehouses.findMany({ select: { ID: true, Name: true } }),
        ]);
        const catMap = new Map(categories.map((c) => [c.ID, c.Name]));
        const whsMap = new Map(warehouses.map((w) => [w.ID, w.Name]));
        const defaultWhs = warehouses[0];
        const rows = itemPricesList.map((ip) => {
            const item = ip.Items || {};
            const resolvedWhsId = item.DfltWhsID || defaultWhs?.ID || null;
            const resolvedWhsName = resolvedWhsId ? whsMap.get(resolvedWhsId) || 'Main Warehouse' : 'Main Warehouse';
            const price = Number(ip.Price ?? 0);
            const lastPurPrc = Number(item.LastPurPrc || 0);
            const marginPercent = (price > 0 && lastPurPrc > 0) ? Math.round(((price - lastPurPrc) / lastPurPrc) * 100) : 0;
            return {
                id: ip.ID,
                itemId: ip.ItemID,
                itemCode: item.Code ?? `ITM-${ip.ItemID}`,
                itemName: item.Name ?? `Item #${ip.ItemID}`,
                catId: item.CatID ?? null,
                categoryName: item.CatID ? catMap.get(item.CatID) ?? null : null,
                dfltWhsId: resolvedWhsId,
                warehouseName: resolvedWhsName,
                uom: item.UoM ?? 'PCS',
                qtyInCase: Number(item.QtyinCase || 1),
                onHand: Number(item.OnHand || 0),
                isCommited: Number(item.IsCommited || 0),
                onOrder: Number(item.OnOrder || 0),
                remarks: item.Remarks || null,
                priceListId: ip.PriceListID,
                priceListName: ip.PriceList?.Name || activePriceList?.name || 'Base Price',
                priceListCode: ip.PriceList?.Code || undefined,
                price: Number(price.toFixed(2)),
                isPriced: true,
                lastPurPrc: Number(lastPurPrc.toFixed(2)),
                marginPercent,
                currency: ip.Currency ? String(ip.Currency).trim() : 'USD',
            };
        });
        const totalPricedItems = total;
        const avgMargin = rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.marginPercent, 0) / rows.length) : 0;
        const highestPrice = rows.length > 0 ? Math.max(...rows.map(r => r.price)) : 0;
        return {
            priceLists,
            activePriceList,
            itemPrices: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                totalItems: total,
                totalPricedItems,
                activePriceListsCount: priceLists.length,
                avgMargin,
                highestPrice,
            },
        };
    }
    /** Upsert Item Price */
    async upsertItemPrice(data) {
        const existing = await prisma.itemPrices.findFirst({
            where: {
                PriceListID: data.priceListId,
                ItemID: data.itemId,
            },
        });
        if (existing) {
            const updated = await prisma.itemPrices.update({
                where: { ID: existing.ID },
                data: {
                    Price: data.price,
                    Currency: data.currency || existing.Currency || 'USD',
                },
            });
            return updated;
        }
        else {
            const created = await prisma.itemPrices.create({
                data: {
                    PriceListID: data.priceListId,
                    ItemID: data.itemId,
                    Price: data.price,
                    Currency: data.currency || 'USD',
                },
            });
            return created;
        }
    }
    /** Bulk update item prices */
    async bulkUpdatePrices(data) {
        const results = [];
        for (const u of data.updates) {
            const res = await this.upsertItemPrice({
                priceListId: data.priceListId,
                itemId: u.itemId,
                price: u.price,
            });
            results.push(res);
        }
        return { success: true, count: results.length };
    }
}
