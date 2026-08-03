import { prisma } from '../../config/db.js';
// ─── Helper: shape a DB item into a clean API response ────────────────────────
function mapItem(item, catMap, whsMap) {
    return {
        id: item.ID,
        code: item.Code ?? null,
        name: item.Name,
        createdDate: item.CreatedDate ?? null,
        catId: item.CatID ?? null,
        categoryName: item.CatID ? catMap.get(item.CatID) ?? null : null,
        subCatId: item.SubCatId ?? null,
        onHand: item.OnHand ?? 0,
        isCommited: item.IsCommited ?? 0,
        onOrder: item.OnOrder ?? 0,
        dfltWhsId: item.DfltWhsID ?? null,
        warehouseName: item.DfltWhsID ? whsMap.get(item.DfltWhsID) ?? null : null,
        uom: item.UoM ?? null,
        qtyInCase: item.QtyinCase ?? 0,
        minQtyLevel: item.MinQtyLevel ?? 0,
        maxQtyLevel: item.MaxQtyLevel ?? 0,
        lastPurPrc: item.LastPurPrc ?? 0,
        weight: item.Weight ?? 0,
        saleVAT: item.SaleVAT ?? null,
        remarks: item.Remarks ?? null,
        monthlyTargetQty: item.MonthlyTargetQty ?? 0,
        dailyTargetQty: item.DailyTargetQty ?? 0,
    };
}
export class ItemsService {
    /** Paginated list of all items with optional search */
    async getItems(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (params.search) {
            const s = params.search.trim();
            where.OR = [
                { Code: { contains: s } },
                { Name: { contains: s } },
                { UoM: { contains: s } },
                { Remarks: { contains: s } },
            ];
        }
        const [total, items, categories, warehouses] = await Promise.all([
            prisma.items.count({ where }),
            prisma.items.findMany({
                where,
                skip,
                take: limit,
                orderBy: { Name: 'asc' },
            }),
            prisma.iTMCategory.findMany({ select: { ID: true, Name: true } }),
            prisma.warehouses.findMany({ select: { ID: true, Name: true } }),
        ]);
        const catMap = new Map(categories.map((c) => [c.ID, c.Name]));
        const whsMap = new Map(warehouses.map((w) => [w.ID, w.Name]));
        return {
            items: items.map((item) => mapItem(item, catMap, whsMap)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                total,
            },
        };
    }
}
