import { prisma } from '../../config/db.js';

// ─── Helper: shape a DB warehouse into a clean API response ────────────────────────
function mapWarehouse(whs: any) {
  return {
    id: whs.ID,
    code: whs.Code,
    name: whs.Name,
    createdDate: whs.CreatedDate,
    street: whs.Street ?? null,
    block: whs.Block ?? null,
    zipCode: whs.ZipCode ?? null,
    city: whs.City ?? null,
    county: whs.County ?? null,
    country: whs.Country ?? null,
    state: whs.State ?? null,
    location: whs.Location ?? null,
  };
}

export class WarehouseService {
  /** Paginated list of all warehouses with optional search */
  public async getWarehouses(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { Code: { contains: s } },
        { Name: { contains: s } },
        { Street: { contains: s } },
        { Location: { contains: s } },
      ];
    }

    const [total, warehouses] = await Promise.all([
      prisma.warehouses.count({ where }),
      prisma.warehouses.findMany({
        where,
        skip,
        take: limit,
        orderBy: { Name: 'asc' },
      }),
    ]);

    return {
      warehouses: warehouses.map(mapWarehouse),
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

  /** Get all items mapped to or stocked in a specific warehouse */
  public async getWarehouseItems(whsId: number) {
    const warehouse = await prisma.warehouses.findUnique({ where: { ID: whsId } });
    if (!warehouse) {
      throw new Error(`Warehouse with ID ${whsId} not found`);
    }

    const [items, itemWhs, categories] = await Promise.all([
      prisma.items.findMany({
        where: {
          OR: [
            { DfltWhsID: whsId },
            { ItemWhs: { some: { WhsID: whsId } } },
          ],
        },
        orderBy: { Name: 'asc' },
      }),
      prisma.itemWhs.findMany({ where: { WhsID: whsId } }),
      prisma.iTMCategory.findMany({ select: { ID: true, Name: true } }),
    ]);

    const catMap = new Map<number, string>(categories.map((c: any) => [c.ID, c.Name]));
    const stockMap = new Map<number, { onHand: number; commited: number; ordered: number }>();
    itemWhs.forEach((iw: any) => {
      stockMap.set(iw.ItemID, {
        onHand: Number(iw.OnHand ?? 0),
        commited: Number(iw.Commited ?? 0),
        ordered: Number(iw.Ordered ?? 0),
      });
    });

    const mapped = items.map((item: any) => {
      const stock = stockMap.get(item.ID);
      const onHand = stock ? stock.onHand : Number(item.OnHand ?? 0);
      const isCommited = stock ? stock.commited : Number(item.IsCommited ?? 0);
      const onOrder = stock ? stock.ordered : Number(item.OnOrder ?? 0);

      return {
        id: item.ID,
        code: item.Code ?? `ITM-${item.ID}`,
        name: item.Name,
        categoryName: item.CatID ? catMap.get(item.CatID) ?? null : null,
        uom: item.UoM ?? 'PCS',
        onHand,
        isCommited,
        onOrder,
        minQtyLevel: Number(item.MinQtyLevel ?? 0),
        maxQtyLevel: Number(item.MaxQtyLevel ?? 0),
        lastPurPrc: Number(item.LastPurPrc ?? 0),
        totalValuation: onHand * Number(item.LastPurPrc ?? 0),
        warehouseId: whsId,
        warehouseName: warehouse.Name,
        warehouseCode: warehouse.Code,
      };
    });

    const totalValuation = mapped.reduce((acc, curr) => acc + curr.totalValuation, 0);
    const inStockCount = mapped.filter(i => i.onHand > 0).length;

    return {
      warehouse: mapWarehouse(warehouse),
      items: mapped,
      stats: {
        totalItems: mapped.length,
        inStockCount,
        totalValuation,
      },
    };
  }
}
