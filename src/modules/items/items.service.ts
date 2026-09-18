import { prisma } from '../../config/db.js';

// ─── Helper: shape a DB item into a clean API response ────────────────────────
function mapItem(
  item: any,
  catMap: Map<number, string>,
  whsMap: Map<number, string>,
  itemWhsMap?: Map<number, number>,
  fallbackWhsId?: number
) {
  let resolvedWhsId = item.DfltWhsID;
  if (!resolvedWhsId || !whsMap.has(resolvedWhsId)) {
    resolvedWhsId = (itemWhsMap && itemWhsMap.get(item.ID)) || fallbackWhsId || null;
  }
  const resolvedWhsName = resolvedWhsId ? whsMap.get(resolvedWhsId) ?? 'Main Warehouse' : 'Main Warehouse';

  return {
    id: item.ID,
    code: item.Code ?? null,
    name: item.Name,
    createdDate: item.CreatedDate ?? null,
    catId: item.CatID ?? null,
    categoryName: item.CatID ? catMap.get(item.CatID) ?? null : null,
    subCatId: item.SubCatId ?? null,
    onHand: Number(item.OnHand ?? 0),
    isCommited: Number(item.IsCommited ?? 0),
    onOrder: Number(item.OnOrder ?? 0),
    dfltWhsId: resolvedWhsId,
    warehouseName: resolvedWhsName,
    uom: item.UoM ?? null,
    qtyInCase: Number(item.QtyinCase ?? 0),
    minQtyLevel: Number(item.MinQtyLevel ?? 0),
    maxQtyLevel: Number(item.MaxQtyLevel ?? 0),
    lastPurPrc: Number(item.LastPurPrc ?? 0),
    weight: Number(item.Weight ?? 0),
    saleVAT: item.SaleVAT ?? null,
    remarks: item.Remarks ?? null,
    monthlyTargetQty: Number(item.MonthlyTargetQty ?? 0),
    dailyTargetQty: Number(item.DailyTargetQty ?? 0),
    posItem: item.POSItem ?? 'N',
    itemPurchased: item.ItemPurchased ?? 'Y',
    itemSales: item.ItemSales ?? 'Y',
    itemInventory: item.ItemInventory ?? 'Y',
    gl: item.GL ?? null,
    glName: item.GLName ?? null,
  };
}

export class ItemsService {
  /** Paginated list of all items with optional search & filters */
  public async getItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    catId?: number;
    whsId?: number;
    lowStock?: boolean;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    if (params.search) {
      const s = params.search.trim();
      andConditions.push({
        OR: [
          { Code: { contains: s } },
          { Name: { contains: s } },
          { UoM: { contains: s } },
          { Remarks: { contains: s } },
        ],
      });
    }

    if (params.catId) {
      andConditions.push({ CatID: params.catId });
    }

    if (params.whsId) {
      andConditions.push({
        OR: [
          { DfltWhsID: params.whsId },
          { ItemWhs: { some: { WhsID: params.whsId } } },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, items, categories, warehouses, itemWhsEntries] = await Promise.all([
      prisma.items.count({ where }),
      prisma.items.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ID: 'desc' },
      }),
      prisma.iTMCategory.findMany({ select: { ID: true, Name: true } }),
      prisma.warehouses.findMany({ select: { ID: true, Name: true } }),
      prisma.itemWhs.findMany({ select: { ItemID: true, WhsID: true } }),
    ]);

    const catMap = new Map<number, string>(categories.map((c: any) => [c.ID, c.Name]));
    const whsMap = new Map<number, string>(warehouses.map((w: any) => [w.ID, w.Name]));
    const itemWhsMap = new Map<number, number>(itemWhsEntries.map((iw: any) => [iw.ItemID, iw.WhsID]));
    const fallbackWhsId = warehouses[0]?.ID || 1;

    const mappedItems = items.map((item: any) => mapItem(item, catMap, whsMap, itemWhsMap, fallbackWhsId));

    // Stats calculations
    const lowStockCount = mappedItems.filter(i => i.minQtyLevel > 0 && i.onHand <= i.minQtyLevel).length;
    const totalValuation = mappedItems.reduce((acc, curr) => acc + (curr.onHand * curr.lastPurPrc), 0);
    const inStockCount = mappedItems.filter(i => i.onHand > 0).length;

    return {
      items: mappedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        inStock: inStockCount,
        lowStock: lowStockCount,
        totalValuation,
      },
    };
  }

  /** Get single item by ID */
  public async getItemById(id: number) {
    const [item, categories, warehouses, itemWhs] = await Promise.all([
      prisma.items.findUnique({ where: { ID: id } }),
      prisma.iTMCategory.findMany({ select: { ID: true, Name: true } }),
      prisma.warehouses.findMany({ select: { ID: true, Name: true } }),
      prisma.itemWhs.findFirst({ where: { ItemID: id } }),
    ]);

    if (!item) {
      throw new Error(`Item with ID ${id} not found`);
    }

    const catMap = new Map<number, string>(categories.map((c: any) => [c.ID, c.Name]));
    const whsMap = new Map<number, string>(warehouses.map((w: any) => [w.ID, w.Name]));
    const itemWhsMap = itemWhs ? new Map<number, number>([[itemWhs.ItemID, itemWhs.WhsID]]) : undefined;
    const fallbackWhsId = warehouses[0]?.ID || 1;

    return mapItem(item, catMap, whsMap, itemWhsMap, fallbackWhsId);
  }

  /** Get item categories */
  public async getCategories() {
    const categories = await prisma.iTMCategory.findMany({
      orderBy: { Name: 'asc' },
    });
    return categories.map((c: any) => ({
      id: c.ID,
      code: c.Code ?? '',
      name: c.Name,
    }));
  }

  /** Create new item */
  public async createItem(data: {
    code?: string;
    name: string;
    catId?: number;
    subCatId?: number;
    dfltWhsId?: number;
    uom?: string;
    qtyInCase?: number;
    minQtyLevel?: number;
    maxQtyLevel?: number;
    lastPurPrc?: number;
    weight?: number;
    saleVAT?: number;
    remarks?: string;
    posItem?: string;
    itemPurchased?: string;
    itemSales?: string;
    itemInventory?: string;
  }) {
    // Generate code if not provided
    let itemCode = data.code?.trim();
    if (!itemCode) {
      const count = await prisma.items.count();
      itemCode = `ITM-${String(count + 1).padStart(4, '0')}`;
    }

    const newItem = await prisma.items.create({
      data: {
        Code: itemCode,
        Name: data.name,
        CatID: data.catId ?? null,
        SubCatId: data.subCatId ?? null,
        DfltWhsID: data.dfltWhsId ?? 0,
        UoM: data.uom ?? 'PCS',
        OnHand: 0,
        IsCommited: 0,
        OnOrder: 0,
        QtyinCase: data.qtyInCase ?? 1,
        MinQtyLevel: data.minQtyLevel ?? 0,
        MaxQtyLevel: data.maxQtyLevel ?? 0,
        LastPurPrc: data.lastPurPrc ?? 0,
        Weight: data.weight ?? 0,
        SaleVAT: data.saleVAT ?? null,
        Remarks: data.remarks ?? null,
        POSItem: data.posItem ?? 'N',
        ItemPurchased: data.itemPurchased ?? 'Y',
        ItemSales: data.itemSales ?? 'Y',
        ItemInventory: data.itemInventory ?? 'Y',
        CreatedDate: new Date(),
        CGuid: `ITM-${Date.now()}`,
      },
    });

    return this.getItemById(newItem.ID);
  }

  /** Update existing item */
  public async updateItem(id: number, data: Partial<{
    code: string;
    name: string;
    catId: number;
    subCatId: number;
    dfltWhsId: number;
    uom: string;
    qtyInCase: number;
    minQtyLevel: number;
    maxQtyLevel: number;
    lastPurPrc: number;
    weight: number;
    saleVAT: number;
    remarks: string;
    posItem: string;
    itemPurchased: string;
    itemSales: string;
    itemInventory: string;
    onHand: number;
  }>) {
    const updateData: any = {};
    if (data.code !== undefined) updateData.Code = data.code;
    if (data.name !== undefined) updateData.Name = data.name;
    if (data.catId !== undefined) updateData.CatID = data.catId;
    if (data.subCatId !== undefined) updateData.SubCatId = data.subCatId;
    if (data.dfltWhsId !== undefined) updateData.DfltWhsID = data.dfltWhsId;
    if (data.uom !== undefined) updateData.UoM = data.uom;
    if (data.qtyInCase !== undefined) updateData.QtyinCase = data.qtyInCase;
    if (data.minQtyLevel !== undefined) updateData.MinQtyLevel = data.minQtyLevel;
    if (data.maxQtyLevel !== undefined) updateData.MaxQtyLevel = data.maxQtyLevel;
    if (data.lastPurPrc !== undefined) updateData.LastPurPrc = data.lastPurPrc;
    if (data.weight !== undefined) updateData.Weight = data.weight;
    if (data.saleVAT !== undefined) updateData.SaleVAT = data.saleVAT;
    if (data.remarks !== undefined) updateData.Remarks = data.remarks;
    if (data.posItem !== undefined) updateData.POSItem = data.posItem;
    if (data.itemPurchased !== undefined) updateData.ItemPurchased = data.itemPurchased;
    if (data.itemSales !== undefined) updateData.ItemSales = data.itemSales;
    if (data.itemInventory !== undefined) updateData.ItemInventory = data.itemInventory;
    if (data.onHand !== undefined) updateData.OnHand = data.onHand;

    await prisma.items.update({
      where: { ID: id },
      data: updateData,
    });

    return this.getItemById(id);
  }

  /** Delete item */
  public async deleteItem(id: number) {
    await prisma.items.delete({
      where: { ID: id },
    });
    return { success: true, id };
  }
}
