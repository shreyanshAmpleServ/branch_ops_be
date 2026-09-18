import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';

export interface GoodsReceiptItemInput {
  ItemID: number;
  ItemCode?: string;
  ItemName?: string;
  Quantity: number;
  UnitPrice: number;
  DiscPrcnt?: number;
  VATCode?: string;
  VATPer?: number;
  WhsCode?: number;
  cost_center?: number;
  project?: string;
  Remarks?: string;
  UoM?: string;
  vendor?: string;
  DIM1?: string;
  DIM2?: string;
  DIM3?: string;
  DIM4?: string;
  DIM5?: string;
  ferightType?: string;
  vendorRef?: string;
  SourceDocId?: string;
  SourceLineNum?: number;
  SourceDocType?: string;
  Location?: string;
}

export interface GoodsReceiptAttachmentInput {
  Attachment: string;
}

export interface GoodsReceiptInput {
  CustCode: string;
  CustName?: string;
  Address?: string;
  CustRefNo?: string;
  Currency?: string;
  CurRate?: number;
  PostDate?: string;
  DeliveryDate?: string;
  PODate?: string;
  Remarks?: string;
  Branch_id?: number;
  OrderCode?: string;
  RequestedNo?: string;
  purchaseOrder?: string;
  relation_from?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Freight?: number;
  Department?: string;
  ExpenseType?: string;
  RequestType?: string;
  TypeRequest?: string;
  TypePayment?: string;
  PurchaseOrderId?: number;
  items: GoodsReceiptItemInput[];
  attachments?: GoodsReceiptAttachmentInput[];
}

export class GoodsReceiptService {
  /** Get all GRPOs with filters */
  public async getGoodsReceipts(params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    branchId?: number;
    typeRequest?: string;
  }) {
    const where: any = {};

    if (params.status && params.status !== 'all') {
      const s = params.status.toLowerCase();
      if (s === 'open' || params.status === 'O') {
        where.Status = { in: ['O', 'Open', 'OPEN'] };
      } else if (s === 'closed' || params.status === 'C' || params.status === 'L') {
        where.Status = { in: ['C', 'L', 'Closed', 'CLOSED'] };
      } else if (s === 'pending' || params.status === 'P') {
        where.Status = { in: ['P', 'Pending', 'PENDING'] };
      } else {
        where.Status = params.status;
      }
    }

    if (params.branchId) {
      where.Branch_id = params.branchId;
    }

    if (params.typeRequest) {
      where.TypeRequest = params.typeRequest;
    }

    if (params.startDate || params.endDate) {
      where.PostDate = {};
      if (params.startDate) {
        where.PostDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.PostDate.lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { CustCode: { contains: s } },
        { CustName: { contains: s } },
        { OrderCode: { contains: s } },
        { purchaseOrder: { contains: s } },
        { RequestedNo: { contains: s } },
        { Remarks: { contains: s } },
      ];
    }

    const receipts = await prisma.goods_recepts_purchased_order.findMany({
      where,
      orderBy: { CreatedDate: 'desc' },
    });

    const userIds = Array.from(new Set([
      ...receipts.map(r => r.CreatedBy).filter(Boolean),
      ...receipts.map(r => Number(r.CustCode)).filter(n => !isNaN(n))
    ])) as number[];

    let userMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const users = await (prisma as any).users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, FirstName: true, LastName: true }
      });
      userMap = users.reduce((acc: any, u: any) => {
        acc[u.id] = `${u.FirstName} ${u.LastName || ''}`.trim();
        return acc;
      }, {} as Record<number, string>);
    }

    const cGuids = receipts.map(r => r.CGuid).filter(Boolean) as string[];
    let itemsMap: Record<string, any[]> = {};
    if (cGuids.length > 0) {
      const allItems = await prisma.goods_recepts_purchased_order_items.findMany({
        where: { CGuid: { in: cGuids } },
        orderBy: { LineNum: 'asc' },
      });
      for (const itm of allItems) {
        if (!itemsMap[itm.CGuid]) itemsMap[itm.CGuid] = [];
        itemsMap[itm.CGuid].push(itm);
      }
    }

    return receipts.map(rec => ({
      ...rec,
      items: itemsMap[rec.CGuid] || [],
      CreatedByName: rec.CreatedBy ? userMap[rec.CreatedBy] : null,
      CustName: !isNaN(Number(rec.CustCode)) && userMap[Number(rec.CustCode)] ? userMap[Number(rec.CustCode)] : rec.CustName
    }));
  }

  /** Get single GRPO details by ID */
  public async getGoodsReceiptById(id: number) {
    const receipt = await prisma.goods_recepts_purchased_order.findUnique({
      where: { ID: id },
    });

    if (!receipt) return null;

    let createdByName: string | null = null;
    if (receipt.CreatedBy) {
      const user = await (prisma as any).users.findUnique({
        where: { id: receipt.CreatedBy },
        select: { id: true, FirstName: true, LastName: true }
      });
      if (user) {
        createdByName = `${user.FirstName} ${user.LastName || ''}`.trim();
      }
    }

    // Line items associated via mainCguid
    const items = await prisma.goods_recepts_purchased_order_items.findMany({
      where: { mainCguid: receipt.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    // Attachments
    const rawAttachments = await prisma.purchase_order_attachments.findMany({
      where: { CGuid: receipt.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    const attachments = rawAttachments.map(att => ({
      ID: att.ID,
      LineNum: att.LineNum,
      CGuid: att.CGuid,
      Attachment: att.Attachment
        ? (Buffer.isBuffer(att.Attachment) ? att.Attachment.toString('utf-8') : String(att.Attachment))
        : '',
    }));

    return {
      ...receipt,
      CreatedByName: createdByName || null,
      items,
      attachments,
    };
  }

  /** Create new GRPO */
  public async createGoodsReceipt(data: GoodsReceiptInput, createdById: number) {
    const cGuid = randomUUID();
    const docDate = data.PostDate ? new Date(data.PostDate) : new Date();

    let totalBefDisc = 0;
    let taxTotal = 0;
    let docTotal = 0;

    const itemsData = data.items.map((item, idx) => {
      const quantity = Number(item.Quantity || 0);
      const unitPrice = Number(item.UnitPrice || 0);
      const discPrcnt = Number(item.DiscPrcnt || 0);
      const vatPer = Number(item.VATPer || 0);

      const lineTotalBefDisc = quantity * unitPrice;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - discPrcnt / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = lineTotalAfterDisc + lineTax;

      totalBefDisc += lineTotalBefDisc;
      taxTotal += lineTax;
      docTotal += lineTotalLC;

      return {
        LineNum: idx + 1,
        ItemID: item.ItemID,
        ItemCode: item.ItemCode || null,
        ItemName: item.ItemName || null,
        LineStatus: 'O',
        Quantity: quantity,
        DeliveredQty: quantity,
        OpenQty: 0,
        WhsCode: item.WhsCode || null,
        UnitPrice: unitPrice,
        DiscPrcnt: discPrcnt,
        VATCode: item.VATCode || null,
        VATPer: vatPer,
        LineTax: lineTax,
        LineTotalLC: lineTotalLC,
        TotalBefDisc: lineTotalBefDisc,
        cost_center: item.cost_center || null,
        project: item.project || null,
        Remarks: item.Remarks || null,
        UoM: item.UoM || null,
        CGuid: randomUUID(),
        mainCguid: cGuid,
        vendor: item.vendor || null,
        DIM1: item.DIM1 || null,
        DIM2: item.DIM2 || null,
        DIM3: item.DIM3 || null,
        DIM4: item.DIM4 || null,
        DIM5: item.DIM5 || null,
        ferightType: item.ferightType || null,
        vendorRef: item.vendorRef || null,
        SourceDocId: item.SourceDocId || (data.purchaseOrder ? String(data.purchaseOrder) : null),
        SourceLineNum: item.SourceLineNum || (idx + 1),
        SourceDocType: item.SourceDocType || 'PO',
        Location: item.Location || null,
      };
    });

    const headerDiscPrcnt = Number(data.DiscPrcnt || 0);
    const freight = Number(data.Freight || 0);
    const roundingAmnt = Number(data.RoundingAmnt || 0);

    const docTotalAfterHeaderDisc = (totalBefDisc * (1 - headerDiscPrcnt / 100)) + taxTotal + freight + roundingAmnt;

    const result = await prisma.$transaction(async (tx) => {
      // Create Header
      const receipt = await tx.goods_recepts_purchased_order.create({
        data: {
          PostDate: docDate,
          DeliveryDate: data.DeliveryDate ? new Date(data.DeliveryDate) : docDate,
          PODate: data.PODate ? new Date(data.PODate) : docDate,
          TypePayment: data.TypePayment || 'Cash',
          DiscPrcnt: headerDiscPrcnt,
          TaxTotal: taxTotal,
          DocTotal: docTotalAfterHeaderDisc,
          TotalBefDisc: totalBefDisc,
          Freight: freight,
          Rounding: data.Rounding || 'N',
          RoundingAmnt: roundingAmnt,
          Remarks: data.Remarks || null,
          Status: 'Open',
          CreatedDate: new Date(),
          CGuid: cGuid,
          AprStatus: 'Y',
          CreatedBy: createdById,
          Branch_id: data.Branch_id || 1,
          RequestType: data.RequestType || 'Item',
          TypeRequest: data.TypeRequest || 'Item',
          CustCode: data.CustCode,
          CustName: data.CustName || null,
          purchaseOrder: data.purchaseOrder ? String(data.purchaseOrder) : null,
          RequestedNo: data.RequestedNo || null,
          ExpenseType: data.ExpenseType || null,
          Department: data.Department || null,
          relation_from: data.relation_from || (data.purchaseOrder ? `Copy From Purchase Order (PO26/${data.purchaseOrder})` : 'Manual Entry'),
          SapStatus: 'N',
        },
      });

      // Update sequential OrderCode
      const generatedCode = `GR26/${receipt.ID}`;
      await tx.goods_recepts_purchased_order.update({
        where: { ID: receipt.ID },
        data: { OrderCode: generatedCode },
      });

      // Insert Items
      if (itemsData.length > 0) {
        await tx.goods_recepts_purchased_order_items.createMany({
          data: itemsData,
        });
      }

      // Insert Attachments
      if (data.attachments && data.attachments.length > 0) {
        await tx.purchase_order_attachments.createMany({
          data: data.attachments.map((att, i) => ({
            LineNum: i + 1,
            CGuid: cGuid,
            Attachment: att.Attachment,
          })),
        });
      }

      return {
        ...receipt,
        OrderCode: generatedCode,
      };
    });

    return this.getGoodsReceiptById(result.ID);
  }

  /** Update existing GRPO */
  public async updateGoodsReceipt(id: number, data: GoodsReceiptInput, updatedById: number) {
    const existing = await prisma.goods_recepts_purchased_order.findUnique({
      where: { ID: id },
    });

    if (!existing) {
      throw new NotFoundError('Goods Receipt Purchase Order not found');
    }

    const docDate = data.PostDate ? new Date(data.PostDate) : (existing.PostDate || new Date());

    let totalBefDisc = 0;
    let taxTotal = 0;
    let docTotal = 0;

    const itemsData = data.items.map((item, idx) => {
      const quantity = Number(item.Quantity || 0);
      const unitPrice = Number(item.UnitPrice || 0);
      const discPrcnt = Number(item.DiscPrcnt || 0);
      const vatPer = Number(item.VATPer || 0);

      const lineTotalBefDisc = quantity * unitPrice;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - discPrcnt / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = lineTotalAfterDisc + lineTax;

      totalBefDisc += lineTotalBefDisc;
      taxTotal += lineTax;
      docTotal += lineTotalLC;

      return {
        LineNum: idx + 1,
        ItemID: item.ItemID,
        ItemCode: item.ItemCode || null,
        ItemName: item.ItemName || null,
        LineStatus: 'O',
        Quantity: quantity,
        DeliveredQty: quantity,
        OpenQty: 0,
        WhsCode: item.WhsCode || null,
        UnitPrice: unitPrice,
        DiscPrcnt: discPrcnt,
        VATCode: item.VATCode || null,
        VATPer: vatPer,
        LineTax: lineTax,
        LineTotalLC: lineTotalLC,
        TotalBefDisc: lineTotalBefDisc,
        cost_center: item.cost_center || null,
        project: item.project || null,
        Remarks: item.Remarks || null,
        UoM: item.UoM || null,
        CGuid: randomUUID(),
        mainCguid: existing.CGuid,
        vendor: item.vendor || null,
        DIM1: item.DIM1 || null,
        DIM2: item.DIM2 || null,
        DIM3: item.DIM3 || null,
        DIM4: item.DIM4 || null,
        DIM5: item.DIM5 || null,
        ferightType: item.ferightType || null,
        vendorRef: item.vendorRef || null,
        SourceDocId: item.SourceDocId || (data.purchaseOrder ? String(data.purchaseOrder) : null),
        SourceLineNum: item.SourceLineNum || (idx + 1),
        SourceDocType: item.SourceDocType || 'PO',
        Location: item.Location || null,
      };
    });

    const headerDiscPrcnt = Number(data.DiscPrcnt || 0);
    const freight = Number(data.Freight || 0);
    const roundingAmnt = Number(data.RoundingAmnt || 0);

    const docTotalAfterHeaderDisc = (totalBefDisc * (1 - headerDiscPrcnt / 100)) + taxTotal + freight + roundingAmnt;

    await prisma.$transaction(async (tx) => {
      // Update Header
      await tx.goods_recepts_purchased_order.update({
        where: { ID: id },
        data: {
          PostDate: docDate,
          DeliveryDate: data.DeliveryDate ? new Date(data.DeliveryDate) : existing.DeliveryDate,
          PODate: data.PODate ? new Date(data.PODate) : existing.PODate,
          TypePayment: data.TypePayment || existing.TypePayment,
          DiscPrcnt: headerDiscPrcnt,
          TaxTotal: taxTotal,
          DocTotal: docTotalAfterHeaderDisc,
          TotalBefDisc: totalBefDisc,
          Freight: freight,
          Rounding: data.Rounding || existing.Rounding,
          RoundingAmnt: roundingAmnt,
          Remarks: data.Remarks || null,
          UpdatedBy: updatedById,
          UpdatedDate: new Date(),
          Branch_id: data.Branch_id || existing.Branch_id,
          RequestType: data.RequestType || existing.RequestType,
          TypeRequest: data.TypeRequest || existing.TypeRequest,
          CustCode: data.CustCode || existing.CustCode,
          CustName: data.CustName || existing.CustName,
          purchaseOrder: data.purchaseOrder ? String(data.purchaseOrder) : existing.purchaseOrder,
          RequestedNo: data.RequestedNo || existing.RequestedNo,
          ExpenseType: data.ExpenseType || existing.ExpenseType,
          Department: data.Department || existing.Department,
          relation_from: data.relation_from || existing.relation_from,
        },
      });

      // Replace Items
      await tx.goods_recepts_purchased_order_items.deleteMany({
        where: { mainCguid: existing.CGuid },
      });

      if (itemsData.length > 0) {
        await tx.goods_recepts_purchased_order_items.createMany({
          data: itemsData,
        });
      }

      // Replace Attachments
      if (data.attachments) {
        await tx.purchase_order_attachments.deleteMany({
          where: { CGuid: existing.CGuid },
        });

        if (data.attachments.length > 0) {
          await tx.purchase_order_attachments.createMany({
            data: data.attachments.map((att, i) => ({
              LineNum: i + 1,
              CGuid: existing.CGuid,
              Attachment: att.Attachment,
            })),
          });
        }
      }
    });

    return this.getGoodsReceiptById(id);
  }

  /** Delete GRPO */
  public async deleteGoodsReceipt(id: number) {
    const existing = await prisma.goods_recepts_purchased_order.findUnique({
      where: { ID: id },
    });

    if (!existing) {
      throw new NotFoundError('Goods Receipt Purchase Order not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.goods_recepts_purchased_order_items.deleteMany({
        where: { mainCguid: existing.CGuid },
      });

      await tx.purchase_order_attachments.deleteMany({
        where: { CGuid: existing.CGuid },
      });

      await tx.goods_recepts_purchased_order.delete({
        where: { ID: id },
      });
    });

    return { message: 'Goods Receipt Purchase Order deleted successfully' };
  }
}
