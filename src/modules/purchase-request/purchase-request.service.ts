import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';

export interface PurchaseRequestItemInput {
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

export interface PurchaseRequestAttachmentInput {
  Attachment: string;
}

export interface PurchaseRequestInput {
  CustCode: string;
  CustName?: string;
  Address?: string;
  CustRefNo?: string;
  Currency?: string;
  CurRate?: number;
  PostDate?: string;
  DueDate?: string;
  TypeRequest: string;
  RequestedByDate?: string;
  RequestedNo?: string;
  Remarks?: string;
  Branch_id?: number;
  RequestType?: string;
  Expense_type?: string;
  memo_text?: string;
  Department?: string;
  items: PurchaseRequestItemInput[];
  attachments?: PurchaseRequestAttachmentInput[];
}

export class PurchaseRequestService {
  /** Get all purchase requests with filters */
  public async getPurchaseRequests(params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    branchId?: number;
    typeRequest?: string;
  }) {
    const where: any = {};

    if (params.status && params.status !== 'all') {
      where.Status = params.status;
    }

    if (params.typeRequest && params.typeRequest !== 'all') {
      where.TypeRequest = params.typeRequest;
    }

    if (params.branchId) {
      where.Branch_id = params.branchId;
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
        { RequestedNo: { contains: s } },
        { Remarks: { contains: s } },
      ];
    }

    const requests = await prisma.purchase_request.findMany({
      where,
      orderBy: { CreatedDate: 'desc' },
    });

    const userIds = Array.from(new Set([
      ...requests.map(r => r.CreatedBy).filter(Boolean),
      ...requests.map(r => Number(r.CustCode)).filter(n => !isNaN(n))
    ])) as number[];

    let userMap: Record<number, string> = {};
    if (userIds.length > 0) {
      // Assuming 'Users' model exists as checked
      const users = await (prisma as any).users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, FirstName: true, LastName: true }
      });
      userMap = users.reduce((acc: any, u: any) => {
        acc[u.id] = `${u.FirstName} ${u.LastName || ''}`.trim();
        return acc;
      }, {} as Record<number, string>);
    }

    return requests.map(req => ({
      ...req,
      CreatedByName: req.CreatedBy ? userMap[req.CreatedBy] : null,
      CustName: !isNaN(Number(req.CustCode)) && userMap[Number(req.CustCode)] ? userMap[Number(req.CustCode)] : req.CustName
    }));
  }

  /** Get single purchase request details by ID */
  public async getPurchaseRequestById(id: number) {
    const request = await prisma.purchase_request.findUnique({
      where: { ID: id },
    });

    if (!request) return null;

    // Fetch items and attachments mapped by CGuid
    const items = await prisma.purchase_request_items.findMany({
      where: { CGuid: request.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    const attachments = await prisma.purchase_request_attachments.findMany({
      where: { CGuid: request.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    return {
      ...request,
      items,
      attachments,
    };
  }

  /** Create new purchase request */
  public async createPurchaseRequest(data: PurchaseRequestInput, createdById: number) {
    const cGuid = randomUUID();
    const docDate = data.PostDate ? new Date(data.PostDate) : new Date();

    // Calculate document totals
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
        LineStatus: 'O', // O = Open
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
        po_id: item.po_id || null,
        Location: item.Location || null,
      };
    });

    const attachmentsData = (data.attachments || []).map((att, idx) => ({
      LineNum: idx + 1,
      Attachment: att.Attachment,
      CGuid: cGuid,
    }));

    // Generate RequestedNo if not provided
    const requestedNo = data.RequestedNo || `PR-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Insert header
      const header = await tx.purchase_request.create({
        data: {
          CustCode: data.CustCode,
          CustName: data.CustName || null,
          Address: data.Address || null,
          CustRefNo: data.CustRefNo || null,
          Currency: data.Currency || 'TZS',
          CurRate: data.CurRate || 1.0,
          PostDate: docDate,
          DueDate: data.DueDate ? new Date(data.DueDate) : null,
          TypeRequest: data.TypeRequest,
          RequestedByDate: data.RequestedByDate ? new Date(data.RequestedByDate) : null,
          RequestedNo: requestedNo,
          DiscPrcnt: data.items.length > 0 ? 0 : 0, // Header discount can be 0 or calculated
          TaxTotal: taxTotal,
          DocTotal: docTotal,
          TotalBefDisc: totalBefDisc,
          Remarks: data.Remarks || null,
          Status: 'Pending',
          CGuid: cGuid,
          AprStatus: 'P', // P = Pending approval
          CreatedBy: createdById,
          Branch_id: data.Branch_id || null,
          RequestType: data.RequestType || 'Direct',
          Expense_type: data.Expense_type || null,
          memo_text: data.memo_text || null,
          Department: data.Department || null,
        },
      });

      // 2. Insert items
      if (itemsData.length > 0) {
        await tx.purchase_request_items.createMany({
          data: itemsData,
        });
      }

      // 3. Insert attachments
      if (attachmentsData.length > 0) {
        await tx.purchase_request_attachments.createMany({
          data: attachmentsData,
        });
      }

      return header;
    });

    return this.getPurchaseRequestById(result.ID);
  }

  /** Update purchase request details and items */
  public async updatePurchaseRequest(id: number, data: Partial<PurchaseRequestInput> & { Status?: string; AprStatus?: string; AprRemark?: string }, updatedById: number) {
    const existing = await this.getPurchaseRequestById(id);
    if (!existing) throw new NotFoundError('Purchase request not found');

    const cGuid = existing.CGuid;
    const docDate = data.PostDate ? new Date(data.PostDate) : existing.PostDate;

    let totalBefDisc = Number(existing.TotalBefDisc || 0);
    let taxTotal = Number(existing.TaxTotal || 0);
    let docTotal = Number(existing.DocTotal || 0);

    const result = await prisma.$transaction(async (tx) => {
      // If items are provided, replace existing items
      if (data.items) {
        // 1. Delete old items
        await tx.purchase_request_items.deleteMany({
          where: { CGuid: cGuid },
        });

        // 2. Re-calculate totals and prepare new items
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
            po_id: item.po_id || null,
            Location: item.Location || null,
          };
        });

        // 3. Create new items
        if (itemsData.length > 0) {
          await tx.purchase_request_items.createMany({
            data: itemsData,
          });
        }
      }

      // If attachments are provided, replace them
      if (data.attachments) {
        await tx.purchase_request_attachments.deleteMany({
          where: { CGuid: cGuid },
        });

        const attachmentsData = data.attachments.map((att, idx) => ({
          LineNum: idx + 1,
          Attachment: att.Attachment,
          CGuid: cGuid,
        }));

        if (attachmentsData.length > 0) {
          await tx.purchase_request_attachments.createMany({
            data: attachmentsData,
          });
        }
      }

      // Update header
      const updatedHeader = await tx.purchase_request.update({
        where: { ID: id },
        data: {
          CustCode: data.CustCode || existing.CustCode,
          CustName: data.CustName || existing.CustName,
          Address: data.Address || existing.Address,
          CustRefNo: data.CustRefNo || existing.CustRefNo,
          Currency: data.Currency || existing.Currency,
          CurRate: data.CurRate || existing.CurRate,
          PostDate: docDate,
          DueDate: data.DueDate ? new Date(data.DueDate) : existing.DueDate,
          TypeRequest: data.TypeRequest || existing.TypeRequest,
          RequestedByDate: data.RequestedByDate ? new Date(data.RequestedByDate) : existing.RequestedByDate,
          Remarks: data.Remarks || existing.Remarks,
          Status: data.Status || existing.Status,
          TaxTotal: taxTotal,
          DocTotal: docTotal,
          TotalBefDisc: totalBefDisc,
          Branch_id: data.Branch_id !== undefined ? data.Branch_id : existing.Branch_id,
          RequestType: data.RequestType || existing.RequestType,
          Expense_type: data.Expense_type || existing.Expense_type,
          memo_text: data.memo_text || existing.memo_text,
          Department: data.Department || existing.Department,
          AprStatus: data.AprStatus || existing.AprStatus,
          AprRemark: data.AprRemark || existing.AprRemark,
          UpdatedBy: updatedById,
          UpdatedDate: new Date(),
        },
      });

      return updatedHeader;
    });

    return this.getPurchaseRequestById(result.ID);
  }

  /** Delete purchase request and related items/attachments */
  public async deletePurchaseRequest(id: number): Promise<boolean> {
    const existing = await prisma.purchase_request.findUnique({
      where: { ID: id },
    });

    if (!existing) return false;

    await prisma.$transaction(async (tx) => {
      // 1. Delete items
      await tx.purchase_request_items.deleteMany({
        where: { CGuid: existing.CGuid },
      });

      // 2. Delete attachments
      await tx.purchase_request_attachments.deleteMany({
        where: { CGuid: existing.CGuid },
      });

      // 3. Delete header
      await tx.purchase_request.delete({
        where: { ID: id },
      });
    });

    return true;
  }
}
