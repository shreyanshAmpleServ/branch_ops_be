import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';

export interface PurchaseOrderItemInput {
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
  po_id?: string;
  Location?: string;
}

export interface PurchaseOrderAttachmentInput {
  Attachment: string;
}

export interface PurchaseOrderInput {
  CustCode: string;
  CustName?: string;
  Address?: string;
  CustRefNo?: string;
  Currency?: string;
  CurRate?: number;
  PostDate?: string;
  DueDate?: string;
  ReceiptDate?: string;
  PODate?: string;
  TaxDate?: string;
  Remarks?: string;
  Branch_id?: number;
  OrderCode?: string;
  RequestedNo?: string;
  relation_from?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Freight?: number;
  Department?: string;
  memo_text?: string;
  ExpenseType?: string;
  Expense_type?: string;
  RequestType?: string;
  TypeRequest?: string;
  TypePayment?: string;
  Pr_ID?: string;
  Pq_ID?: string;
  PurchaseRequestId?: number;
  PurchaseQuotationId?: number;
  items: PurchaseOrderItemInput[];
  attachments?: PurchaseOrderAttachmentInput[];
}

export class PurchaseOrderService {
  /** Get all purchase orders with filters */
  public async getPurchaseOrders(params: {
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
        { RequestedNo: { contains: s } },
        { Remarks: { contains: s } },
      ];
    }

    const orders = await prisma.purchase_order.findMany({
      where,
      orderBy: { CreatedDate: 'desc' },
    });

    const userIds = Array.from(new Set([
      ...orders.map(o => o.CreatedBy).filter(Boolean),
      ...orders.map(o => Number(o.CustCode)).filter(n => !isNaN(n))
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

    const cGuids = orders.map(o => o.CGuid).filter(Boolean) as string[];
    let itemsMap: Record<string, any[]> = {};
    if (cGuids.length > 0) {
      const allItems = await prisma.purchase_order_items.findMany({
        where: { CGuid: { in: cGuids } },
        orderBy: { LineNum: 'asc' },
      });
      for (const itm of allItems) {
        if (!itemsMap[itm.CGuid]) itemsMap[itm.CGuid] = [];
        itemsMap[itm.CGuid].push(itm);
      }
    }

    return orders.map(ord => ({
      ...ord,
      items: itemsMap[ord.CGuid] || [],
      CreatedByName: ord.CreatedBy ? userMap[ord.CreatedBy] : null,
      CustName: !isNaN(Number(ord.CustCode)) && userMap[Number(ord.CustCode)] ? userMap[Number(ord.CustCode)] : ord.CustName
    }));
  }

  /** Get single purchase order details by ID */
  public async getPurchaseOrderById(id: number) {
    const order = await prisma.purchase_order.findUnique({
      where: { ID: id },
    });

    if (!order) return null;

    let createdByName: string | null = null;
    if (order.CreatedBy) {
      const user = await (prisma as any).users.findUnique({
        where: { id: order.CreatedBy },
        select: { id: true, FirstName: true, LastName: true }
      });
      if (user) {
        createdByName = `${user.FirstName} ${user.LastName || ''}`.trim();
      }
    }

    const items = await prisma.purchase_order_items.findMany({
      where: { CGuid: order.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    const rawAttachments = await prisma.purchase_order_attachments.findMany({
      where: { CGuid: order.CGuid },
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
      ...order,
      CreatedByName: createdByName || null,
      items,
      attachments,
    };
  }

  /** Create new purchase order */
  public async createPurchaseOrder(data: PurchaseOrderInput, createdById: number) {
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
        DeliveredQty: 0,
        OpenQty: quantity,
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
        CGuid: cGuid,
        vendor: item.vendor || null,
        DIM1: item.DIM1 || null,
        DIM2: item.DIM2 || null,
        DIM3: item.DIM3 || null,
        DIM4: item.DIM4 || null,
        DIM5: item.DIM5 || null,
        ferightType: item.ferightType || null,
        vendorRef: item.vendorRef || null,
        Location: item.Location || null,
      };
    });

    const attachmentsData = (data.attachments || []).map((att, idx) => ({
      LineNum: idx + 1,
      Attachment: att.Attachment,
      CGuid: cGuid,
    }));

    const orderCode = data.OrderCode || `PO-${Date.now().toString().slice(-6)}`;
    const requestedNo = data.RequestedNo || orderCode;

    const result = await prisma.$transaction(async (tx) => {
      const header = await tx.purchase_order.create({
        data: {
          CustCode: data.CustCode,
          CustName: data.CustName || null,
          PostDate: docDate,
          ReceiptDate: data.ReceiptDate ? new Date(data.ReceiptDate) : null,
          PODate: data.PODate ? new Date(data.PODate) : docDate,
          OrderCode: orderCode,
          RequestedNo: requestedNo,
          DiscPrcnt: data.DiscPrcnt || 0,
          TaxTotal: taxTotal,
          DocTotal: docTotal,
          TotalBefDisc: totalBefDisc,
          Freight: data.Freight || 0,
          Remarks: data.Remarks || null,
          Status: 'Pending',
          CGuid: cGuid,
          AprStatus: 'P',
          CreatedBy: createdById,
          CreatedDate: new Date(),
          Branch_id: data.Branch_id || null,
          RequestType: data.RequestType || 'Direct',
          TypeRequest: data.TypeRequest || 'Item',
          ExpenseType: data.ExpenseType || data.Expense_type || null,
          Department: data.Department || null,
          TypePayment: data.TypePayment || '',
          Pr_ID: data.Pr_ID ? String(data.Pr_ID) : null,
          Pq_ID: data.Pq_ID ? String(data.Pq_ID) : null,
          PurchaseRequestId: data.PurchaseRequestId || (typeof data.Pr_ID === 'number' ? data.Pr_ID : null),
          PurchaseQuotationId: data.PurchaseQuotationId || null,
          relation_from: data.relation_from || null,
        },
      });

      if (itemsData.length > 0) {
        await tx.purchase_order_items.createMany({
          data: itemsData.map(item => ({ ...item, PurchaseOrderId: header.ID })),
        });
      }

      if (attachmentsData.length > 0) {
        await tx.purchase_order_attachments.createMany({
          data: attachmentsData.map(att => ({ ...att, PurchaseOrderId: header.ID })),
        });
      }

      return header;
    });

    return this.getPurchaseOrderById(result.ID);
  }

  /** Update purchase order details and items */
  public async updatePurchaseOrder(
    id: number,
    data: Partial<PurchaseOrderInput> & { Status?: string; AprStatus?: string; AprRemark?: string },
    updatedById: number
  ) {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) throw new NotFoundError('Purchase order not found');

    const cGuid = existing.CGuid;
    const docDate = data.PostDate ? new Date(data.PostDate) : existing.PostDate;

    let totalBefDisc = Number(existing.TotalBefDisc || 0);
    let taxTotal = Number(existing.TaxTotal || 0);
    let docTotal = Number(existing.DocTotal || 0);

    const result = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.purchase_order_items.deleteMany({
          where: { CGuid: cGuid },
        });

        totalBefDisc = 0;
        taxTotal = 0;
        docTotal = 0;

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
            DeliveredQty: 0,
            OpenQty: quantity,
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
            CGuid: cGuid,
            vendor: item.vendor || null,
            DIM1: item.DIM1 || null,
            DIM2: item.DIM2 || null,
            DIM3: item.DIM3 || null,
            DIM4: item.DIM4 || null,
            DIM5: item.DIM5 || null,
            ferightType: item.ferightType || null,
            vendorRef: item.vendorRef || null,
            Location: item.Location || null,
          };
        });

        if (itemsData.length > 0) {
          await tx.purchase_order_items.createMany({
            data: itemsData,
          });
        }
      }

      if (data.attachments) {
        await tx.purchase_order_attachments.deleteMany({
          where: { CGuid: cGuid },
        });

        const attachmentsData = data.attachments.map((att, idx) => ({
          LineNum: idx + 1,
          Attachment: att.Attachment,
          CGuid: cGuid,
        }));

        if (attachmentsData.length > 0) {
          await tx.purchase_order_attachments.createMany({
            data: attachmentsData,
          });
        }
      }

      const updatePayload: any = {
        UpdatedBy: updatedById,
        UpdatedDate: new Date(),
      };

      if (data.CustCode !== undefined) updatePayload.CustCode = data.CustCode;
      if (data.CustName !== undefined) updatePayload.CustName = data.CustName;
      if (data.PostDate !== undefined) updatePayload.PostDate = docDate;
      if (data.ReceiptDate !== undefined) updatePayload.ReceiptDate = data.ReceiptDate ? new Date(data.ReceiptDate) : null;
      if (data.PODate !== undefined) updatePayload.PODate = data.PODate ? new Date(data.PODate) : null;
      if (data.Remarks !== undefined) updatePayload.Remarks = data.Remarks;
      if (data.Branch_id !== undefined) updatePayload.Branch_id = data.Branch_id;
      if (data.OrderCode !== undefined) updatePayload.OrderCode = data.OrderCode;
      if (data.RequestedNo !== undefined) updatePayload.RequestedNo = data.RequestedNo;
      if (data.relation_from !== undefined) updatePayload.relation_from = data.relation_from;
      if (data.DiscPrcnt !== undefined) updatePayload.DiscPrcnt = data.DiscPrcnt;
      if (data.Freight !== undefined) updatePayload.Freight = data.Freight;
      if (data.Department !== undefined) updatePayload.Department = data.Department;
      if (data.ExpenseType !== undefined) updatePayload.ExpenseType = data.ExpenseType;
      if (data.Expense_type !== undefined) updatePayload.ExpenseType = data.Expense_type;
      if (data.RequestType !== undefined) updatePayload.RequestType = data.RequestType;
      if (data.TypeRequest !== undefined) updatePayload.TypeRequest = data.TypeRequest;
      if (data.TypePayment !== undefined) updatePayload.TypePayment = data.TypePayment;
      if (data.Status !== undefined) updatePayload.Status = data.Status;
      if (data.AprStatus !== undefined) updatePayload.AprStatus = data.AprStatus;
      if (data.AprRemark !== undefined) updatePayload.AprRemark = data.AprRemark;
      if (data.Pr_ID !== undefined) updatePayload.Pr_ID = String(data.Pr_ID);
      if (data.Pq_ID !== undefined) updatePayload.Pq_ID = String(data.Pq_ID);
      if (data.PurchaseRequestId !== undefined) updatePayload.PurchaseRequestId = data.PurchaseRequestId;
      if (data.PurchaseQuotationId !== undefined) updatePayload.PurchaseQuotationId = data.PurchaseQuotationId;

      if (data.items) {
        updatePayload.TotalBefDisc = totalBefDisc;
        updatePayload.TaxTotal = taxTotal;
        updatePayload.DocTotal = docTotal;
      }

      await tx.purchase_order.update({
        where: { ID: id },
        data: updatePayload,
      });
    });

    return this.getPurchaseOrderById(id);
  }

  /** Delete purchase order */
  public async deletePurchaseOrder(id: number) {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) return false;

    await prisma.$transaction(async (tx) => {
      await tx.purchase_order_items.deleteMany({
        where: { CGuid: existing.CGuid },
      });
      await tx.purchase_order_attachments.deleteMany({
        where: { CGuid: existing.CGuid },
      });
      await tx.purchase_order.delete({
        where: { ID: id },
      });
    });

    return true;
  }
}
