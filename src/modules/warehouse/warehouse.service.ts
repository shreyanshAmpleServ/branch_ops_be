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
}
