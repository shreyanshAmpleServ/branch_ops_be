import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';

export interface PurchaseQuotationItemInput {
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

export interface PurchaseQuotationAttachmentInput {
  Attachment: string;
}

export interface PurchaseQuotationInput {
  CustCode: string;
  CustName?: string;
  Address?: string;
  CustRefNo?: string;
  Currency?: string;
  CurRate?: number;
  PostDate?: string;
  DueDate?: string;
  TaxDate?: string;
  Remarks?: string;
  Branch_id?: number;
  QuotCode?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Freight?: number;
  Department?: string;
  memo_text?: string;
  Expense_type?: string;
  RequestType?: string;
  TypeRequest?: string;
  PurchaseRequestId?: number;
  Pr_ID?: string;
  CreatedBy?: number;
  ReqBy?: number;
  items: PurchaseQuotationItemInput[];
  attachments?: PurchaseQuotationAttachmentInput[];
}

export class PurchaseQuotationService {
  /** Get all purchase quotations with filters */
  public async getPurchaseQuotations(params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    branchId?: number;
    typeRequest?: string;
  }) {
    const where: any = {};

    if (params.typeRequest) {
      where.SalesType = params.typeRequest === 'Service' ? 2 : 1;
    }

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
        { QuotCode: { contains: s } },
        { Remarks: { contains: s } },
      ];
    }

    const quotations = await prisma.quotations.findMany({
      where,
      orderBy: { CreatedDate: 'desc' },
    });

    const userIds = Array.from(new Set([
      ...quotations.map(q => q.CreatedBy).filter(Boolean),
      ...quotations.map(q => Number(q.CustCode)).filter(n => !isNaN(n))
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

    const cGuids = quotations.map(q => q.CGuid).filter(Boolean) as string[];
    let itemsMap: Record<string, any[]> = {};
    if (cGuids.length > 0) {
      const allItems = await prisma.quotationItems.findMany({
        where: { CGuid: { in: cGuids } },
        orderBy: { LineNum: 'asc' },
      });
      for (const itm of allItems) {
        if (!itemsMap[itm.CGuid]) itemsMap[itm.CGuid] = [];
        itemsMap[itm.CGuid].push(itm);
      }
    }

    return quotations.map(q => ({
      ...q,
      items: itemsMap[q.CGuid] || [],
      TypeRequest: q.SalesType === 2 ? 'Service' : 'Item',
      RequestType: q.SalesType === 2 ? 'Service' : 'Item',
      CreatedByName: q.CreatedBy ? userMap[q.CreatedBy] : null,
      CustName: !isNaN(Number(q.CustCode)) && userMap[Number(q.CustCode)] ? userMap[Number(q.CustCode)] : q.CustName
    }));
  }

  /** Get single purchase quotation details by ID */
  public async getPurchaseQuotationById(id: number) {
    const quotation = await prisma.quotations.findUnique({
      where: { ID: id },
    });

    if (!quotation) return null;

    let createdByName: string | null = null;
    if (quotation.CreatedBy) {
      const user = await (prisma as any).users.findUnique({
        where: { id: quotation.CreatedBy },
        select: { id: true, FirstName: true, LastName: true }
      });
      if (user) {
        createdByName = `${user.FirstName} ${user.LastName || ''}`.trim();
      }
    }

    const items = await prisma.quotationItems.findMany({
      where: { CGuid: quotation.CGuid },
      orderBy: { LineNum: 'asc' },
    });

    const rawAttachments = await prisma.quotationAttachments.findMany({
      where: { CGuid: quotation.CGuid },
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
      ...quotation,
      TypeRequest: quotation.SalesType === 2 ? 'Service' : 'Item',
      RequestType: quotation.SalesType === 2 ? 'Service' : 'Item',
      CreatedByName: createdByName || (quotation as any).CreatedByName || null,
      items,
      attachments,
    };
  }

  /** Create new purchase quotation */
  public async createPurchaseQuotation(data: PurchaseQuotationInput, createdById?: number) {
    const cGuid = randomUUID();
    const docDate = data.PostDate ? new Date(data.PostDate) : new Date();

    let totalBefDisc = 0;
    let taxTotal = 0;
    let docTotal = 0;

    const itemsData = (data.items || []).map((item, idx) => {
      const rawItemId = Number(item.ItemID || 0);
      const validItemId = rawItemId > 0 ? rawItemId : 1;
      const quantity = Number(item.Quantity || 0);
      const unitPrice = Number(item.UnitPrice ?? (item as any).Price ?? 0);
      const discPrcnt = Number(item.DiscPrcnt ?? (item as any).DiscountPercent ?? 0);
      const vatPer = Number(item.VATPer ?? (item as any).VatRate ?? 0);
      const vatCode = item.VATCode || (item as any).VatGroup || null;

      const rawWhs: any = item.WhsCode;
      let parsedWhs: number | null = null;
      if (typeof rawWhs === 'number' && !isNaN(rawWhs)) {
        parsedWhs = rawWhs;
      } else if (typeof rawWhs === 'string' && rawWhs.trim() !== '' && !isNaN(parseInt(rawWhs, 10))) {
        parsedWhs = parseInt(rawWhs, 10);
      }

      const lineTotalBefDisc = quantity * unitPrice;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - discPrcnt / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = lineTotalAfterDisc + lineTax;

      totalBefDisc += lineTotalBefDisc;
      taxTotal += lineTax;
      docTotal += lineTotalLC;

      return {
        LineNum: idx + 1,
        ItemID: validItemId,
        ItemCode: item.ItemCode || null,
        ItemName: item.ItemName || null,
        LineStatus: 'O',
        Quantity: quantity,
        DeliveredQty: 0,
        OpenQty: quantity,
        WhsCode: parsedWhs,
        UnitPrice: unitPrice,
        DiscPrcnt: discPrcnt,
        VATCode: vatCode,
        VATPer: vatPer,
        LineTax: lineTax,
        LineTotalLC: lineTotalLC,
        TotalBefDisc: lineTotalBefDisc,
        cost_center: item.cost_center || null,
        project: item.project || null,
        Remarks: item.Remarks || null,
        UoM: item.UoM || null,
        CGuid: cGuid,
      };
    });

    const attachmentsData = (data.attachments || []).map((att, idx) => ({
      LineNum: idx + 1,
      Attachment: att.Attachment ? Buffer.from(att.Attachment, 'utf-8') : null,
      CGuid: cGuid,
    }));

    const quotCode = data.QuotCode || `PQ-${Date.now().toString().slice(-6)}`;

    // Add freight and rounding calculations
    const headerDisc = Number(data.DiscPrcnt || 0);
    const baseAfterHeaderDisc = totalBefDisc * (1 - headerDisc / 100);
    const freightVal = Number(data.Freight || 0);
    const roundingVal = data.Rounding === 'Y' ? Number(data.RoundingAmnt || 0) : 0;
    const finalDocTotal = baseAfterHeaderDisc + taxTotal + freightVal + roundingVal;
    const isService = data.TypeRequest === 'Service' || data.RequestType === 'Service';

    const result = await prisma.$transaction(async (tx) => {
      let creatorConnect: any = undefined;
      const targetCreatedById = data.CreatedBy ? Number(data.CreatedBy) : createdById;
      if (targetCreatedById) {
        const userExists = await (tx as any).users.findUnique({
          where: { id: targetCreatedById },
          select: { id: true }
        });
        if (userExists) {
          creatorConnect = { connect: { id: targetCreatedById } };
        }
      }

      let prConnect: any = undefined;
      if (data.PurchaseRequestId) {
        const prExists = await tx.purchase_request.findUnique({
          where: { ID: data.PurchaseRequestId },
          select: { ID: true }
        });
        if (prExists) {
          prConnect = { connect: { ID: data.PurchaseRequestId } };
        }
      }

      const header = await tx.quotations.create({
        data: {
          CustCode: data.CustCode,
          CustName: data.CustName || 'Supplier',
          Address: data.Address || null,
          CustRefNo: data.CustRefNo || null,
          Currency: data.Currency || 'TZS',
          CurRate: data.CurRate || 1.0,
          PostDate: docDate,
          DueDate: data.DueDate ? new Date(data.DueDate) : null,
          TaxDate: data.TaxDate ? new Date(data.TaxDate) : null,
          DiscPrcnt: headerDisc,
          TaxTotal: taxTotal,
          DocTotal: finalDocTotal,
          TotalBefDisc: totalBefDisc,
          Rounding: data.Rounding || 'N',
          RoundingAmnt: Number(data.RoundingAmnt || 0),
          Remarks: data.Remarks || null,
          Status: 'Pending',
          CGuid: cGuid,
          AprStatus: 'P',
          creator: creatorConnect,
          ReqBy: data.ReqBy ? Number(data.ReqBy) : (data.CreatedBy ? Number(data.CreatedBy) : null),
          Branch_id: data.Branch_id || null,
          QuotCode: quotCode,
          SalesType: isService ? 2 : 1,
          purchase_request: prConnect,
          Pr_ID: data.Pr_ID || null,
        },
      });

      if (itemsData.length > 0) {
        await tx.quotationItems.createMany({
          data: itemsData.map(item => ({ ...item, QuotationId: header.ID })),
        });
      }

      if (attachmentsData.length > 0) {
        await tx.quotationAttachments.createMany({
          data: attachmentsData.map(att => ({ ...att, QuotationId: header.ID })),
        });
      }

      return header;
    });

    return this.getPurchaseQuotationById(result.ID);
  }

  /** Update purchase quotation details */
  public async updatePurchaseQuotation(
    id: number,
    data: Partial<PurchaseQuotationInput> & { Status?: string; AprStatus?: string; AprRemark?: string },
    updatedById?: number
  ) {
    const existing = await this.getPurchaseQuotationById(id);
    if (!existing) throw new NotFoundError('Purchase quotation not found');

    const cGuid = existing.CGuid;
    const docDate = data.PostDate ? new Date(data.PostDate) : existing.PostDate;

    let totalBefDisc = Number(existing.TotalBefDisc || 0);
    let taxTotal = Number(existing.TaxTotal || 0);
    let docTotal = Number(existing.DocTotal || 0);

    const result = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.quotationItems.deleteMany({
          where: { CGuid: cGuid },
        });

        totalBefDisc = 0;
        taxTotal = 0;
        docTotal = 0;

        const itemsData = data.items.map((item, idx) => {
          const rawItemId = Number(item.ItemID || 0);
          const validItemId = rawItemId > 0 ? rawItemId : 1;
          const quantity = Number(item.Quantity || 0);
          const unitPrice = Number(item.UnitPrice ?? (item as any).Price ?? 0);
          const discPrcnt = Number(item.DiscPrcnt ?? (item as any).DiscountPercent ?? 0);
          const vatPer = Number(item.VATPer ?? (item as any).VatRate ?? 0);
          const vatCode = item.VATCode || (item as any).VatGroup || null;

          const rawWhs: any = item.WhsCode;
          let parsedWhs: number | null = null;
          if (typeof rawWhs === 'number' && !isNaN(rawWhs)) {
            parsedWhs = rawWhs;
          } else if (typeof rawWhs === 'string' && rawWhs.trim() !== '' && !isNaN(parseInt(rawWhs, 10))) {
            parsedWhs = parseInt(rawWhs, 10);
          }

          const lineTotalBefDisc = quantity * unitPrice;
          const lineTotalAfterDisc = lineTotalBefDisc * (1 - discPrcnt / 100);
          const lineTax = lineTotalAfterDisc * (vatPer / 100);
          const lineTotalLC = lineTotalAfterDisc + lineTax;

          totalBefDisc += lineTotalBefDisc;
          taxTotal += lineTax;
          docTotal += lineTotalLC;

          return {
            LineNum: idx + 1,
            ItemID: validItemId,
            ItemCode: item.ItemCode || null,
            ItemName: item.ItemName || null,
            LineStatus: 'O',
            Quantity: quantity,
            DeliveredQty: 0,
            OpenQty: quantity,
            WhsCode: parsedWhs,
            UnitPrice: unitPrice,
            DiscPrcnt: discPrcnt,
            VATCode: vatCode,
            VATPer: vatPer,
            LineTax: lineTax,
            LineTotalLC: lineTotalLC,
            TotalBefDisc: lineTotalBefDisc,
            cost_center: item.cost_center || null,
            project: item.project || null,
            Remarks: item.Remarks || null,
            UoM: item.UoM || null,
            CGuid: cGuid,
            QuotationId: id,
          };
        });

        if (itemsData.length > 0) {
          await tx.quotationItems.createMany({
            data: itemsData,
          });
        }
      }

      if (data.attachments) {
        await tx.quotationAttachments.deleteMany({
          where: { CGuid: cGuid },
        });

        const attachmentsData = data.attachments.map((att, idx) => ({
          LineNum: idx + 1,
          Attachment: att.Attachment ? Buffer.from(att.Attachment, 'utf-8') : null,
          CGuid: cGuid,
          QuotationId: id,
        }));

        if (attachmentsData.length > 0) {
          await tx.quotationAttachments.createMany({
            data: attachmentsData,
          });
        }
      }

      const headerDisc = data.DiscPrcnt !== undefined ? Number(data.DiscPrcnt) : Number(existing.DiscPrcnt || 0);
      const baseAfterHeaderDisc = totalBefDisc * (1 - headerDisc / 100);
      const freightVal = data.Freight !== undefined ? Number(data.Freight) : Number((existing as any).Freight || 0);
      const isRounding = data.Rounding !== undefined ? data.Rounding : existing.Rounding;
      const roundingVal = isRounding === 'Y' ? (data.RoundingAmnt !== undefined ? Number(data.RoundingAmnt) : Number(existing.RoundingAmnt || 0)) : 0;
      const finalDocTotal = baseAfterHeaderDisc + taxTotal + freightVal + roundingVal;

      let salesType = existing.SalesType;
      if (data.TypeRequest !== undefined || data.RequestType !== undefined) {
        const isService = data.TypeRequest === 'Service' || data.RequestType === 'Service';
        salesType = isService ? 2 : 1;
      }

      let prConnect: any = undefined;
      if (data.PurchaseRequestId !== undefined) {
        if (data.PurchaseRequestId) {
          const prExists = await tx.purchase_request.findUnique({
            where: { ID: data.PurchaseRequestId },
            select: { ID: true }
          });
          if (prExists) {
            prConnect = { connect: { ID: data.PurchaseRequestId } };
          }
        } else {
          prConnect = { disconnect: true };
        }
      }

      const updatedHeader = await tx.quotations.update({
        where: { ID: id },
        data: {
          CustCode: data.CustCode || existing.CustCode,
          CustName: data.CustName || existing.CustName,
          Address: data.Address !== undefined ? data.Address : existing.Address,
          CustRefNo: data.CustRefNo !== undefined ? data.CustRefNo : existing.CustRefNo,
          Currency: data.Currency || existing.Currency,
          CurRate: data.CurRate || existing.CurRate,
          PostDate: docDate,
          DueDate: data.DueDate ? new Date(data.DueDate) : existing.DueDate,
          TaxDate: data.TaxDate ? new Date(data.TaxDate) : existing.TaxDate,
          Remarks: data.Remarks !== undefined ? data.Remarks : existing.Remarks,
          Status: data.Status || existing.Status,
          DiscPrcnt: headerDisc,
          TaxTotal: taxTotal,
          DocTotal: finalDocTotal,
          TotalBefDisc: totalBefDisc,
          Rounding: isRounding,
          RoundingAmnt: roundingVal,
          Branch_id: data.Branch_id !== undefined ? data.Branch_id : existing.Branch_id,
          ReqBy: data.ReqBy !== undefined ? (data.ReqBy ? Number(data.ReqBy) : null) : (data.CreatedBy ? Number(data.CreatedBy) : undefined),
          SalesType: salesType,
          purchase_request: prConnect,
          Pr_ID: data.Pr_ID !== undefined ? data.Pr_ID : existing.Pr_ID,
          AprStatus: data.AprStatus || existing.AprStatus,
          AprRemark: data.AprRemark || existing.AprRemark,
          UpdatedBy: updatedById || undefined,
          UpdatedDate: new Date(),
        },
      });

      return updatedHeader;
    });

    return this.getPurchaseQuotationById(result.ID);
  }

  /** Delete purchase quotation and related items/attachments */
  public async deletePurchaseQuotation(id: number): Promise<boolean> {
    const existing = await prisma.quotations.findUnique({
      where: { ID: id },
    });

    if (!existing) return false;

    await prisma.$transaction(async (tx) => {
      await tx.quotationItems.deleteMany({
        where: { CGuid: existing.CGuid },
      });

      await tx.quotationAttachments.deleteMany({
        where: { CGuid: existing.CGuid },
      });

      await tx.quotations.delete({
        where: { ID: id },
      });
    });

    return true;
  }
}
