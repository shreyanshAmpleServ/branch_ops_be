import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';
export class QuotationsService {
    /** Get all quotations with search, status, and date range filters */
    async getQuotations(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            const s = params.status.toLowerCase();
            if (s === 'open' || params.status === 'O') {
                where.Status = { in: ['O', 'Open', 'OPEN'] };
            }
            else if (s === 'closed' || params.status === 'C' || params.status === 'L') {
                where.Status = { in: ['C', 'L', 'Closed', 'CLOSED'] };
            }
            else if (s === 'pending' || params.status === 'P') {
                where.Status = { in: ['P', 'Pending', 'PENDING'] };
            }
            else {
                where.Status = params.status;
            }
        }
        if (params.branchId) {
            where.Branch_id = params.branchId;
        }
        if (params.startDate || params.endDate) {
            where.PostDate = {};
            if (params.startDate)
                where.PostDate.gte = new Date(params.startDate);
            if (params.endDate)
                where.PostDate.lte = new Date(params.endDate);
        }
        if (params.search) {
            where.OR = [
                { QuotCode: { contains: params.search } },
                { CustCode: { contains: params.search } },
                { CustName: { contains: params.search } },
                { CustRefNo: { contains: params.search } },
                { SAPDocNum: { contains: params.search } },
            ];
        }
        const quotations = await prisma.quotations.findMany({
            where,
            orderBy: { ID: 'desc' },
            include: {
                creator: { select: { id: true, FirstName: true, LastName: true } },
                items: true,
                orders: { select: { ID: true, OrderCode: true, DocTotal: true, Status: true } },
            },
        });
        return quotations.map(q => ({
            ...q,
            CreatedByName: q.creator ? `${q.creator.FirstName} ${q.creator.LastName || ''}`.trim() : null,
            itemCount: q.items?.length || 0,
            orderCount: q.orders?.length || 0,
        }));
    }
    /** Get quotation by ID with lines and relational orders */
    async getQuotationById(id) {
        const quotation = await prisma.quotations.findUnique({
            where: { ID: id },
            include: {
                creator: { select: { id: true, FirstName: true, LastName: true } },
                items: {
                    include: {
                        Items: true,
                        Warehouses: true,
                    },
                    orderBy: { LineNum: 'asc' },
                },
                orders: {
                    select: { ID: true, OrderCode: true, DocTotal: true, Status: true, CreatedDate: true },
                },
                ar_invoices: {
                    select: { ID: true, InvoiceCode: true, DocTotal: true, Status: true, CreatedDate: true },
                },
            },
        });
        if (!quotation)
            throw new NotFoundError('Sales Quotation not found.');
        return {
            ...quotation,
            CreatedByName: quotation.creator ? `${quotation.creator.FirstName} ${quotation.creator.LastName || ''}`.trim() : null,
        };
    }
    /** Generate unique Quotation code */
    async generateQuotCode() {
        const last = await prisma.quotations.findFirst({
            orderBy: { ID: 'desc' },
            select: { ID: true },
        });
        const nextNum = (last?.ID || 0) + 1;
        const year = new Date().getFullYear().toString().slice(-2);
        return `QT${year}/${String(nextNum).padStart(4, '0')}`;
    }
    /** Create new Sales Quotation */
    async createQuotation(data, createdById) {
        const cGuid = randomUUID();
        const docDate = data.PostDate ? new Date(data.PostDate) : new Date();
        const quotCode = data.QuotCode || await this.generateQuotCode();
        let totalBefDisc = 0;
        let taxTotal = 0;
        let docTotal = 0;
        const itemsData = (data.items || []).map((item, idx) => {
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
            };
        });
        const quotation = await prisma.quotations.create({
            data: {
                CustCode: data.CustCode,
                CustName: data.CustName || '',
                Address: data.Address || null,
                CustRefNo: data.CustRefNo || null,
                Currency: data.Currency || null,
                CurRate: data.CurRate != null ? Number(data.CurRate) : null,
                PostDate: docDate,
                DueDate: data.DueDate ? new Date(data.DueDate) : docDate,
                TaxDate: data.TaxDate ? new Date(data.TaxDate) : docDate,
                Remarks: data.Remarks || null,
                Branch_id: data.Branch_id || null,
                QuotCode: quotCode,
                Status: data.Status || 'O',
                DiscPrcnt: data.DiscPrcnt != null ? Number(data.DiscPrcnt) : 0,
                Rounding: data.Rounding || 'N',
                RoundingAmnt: data.RoundingAmnt != null ? Number(data.RoundingAmnt) : null,
                TotalBefDisc: totalBefDisc,
                TaxTotal: taxTotal,
                DocTotal: docTotal,
                SAPDocNum: data.SAPDocNum || null,
                SAPDocEntry: data.SAPDocEntry ? Number(data.SAPDocEntry) : null,
                CGuid: cGuid,
                CreatedBy: createdById,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: true,
            },
        });
        return quotation;
    }
    /** Update quotation */
    async updateQuotation(id, data, updatedById) {
        const existing = await prisma.quotations.findUnique({
            where: { ID: id },
            include: { items: true },
        });
        if (!existing)
            throw new NotFoundError('Sales Quotation not found.');
        const docDate = data.PostDate ? new Date(data.PostDate) : existing.PostDate;
        let totalBefDisc = 0;
        let taxTotal = 0;
        let docTotal = 0;
        const itemsData = (data.items || []).map((item, idx) => {
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
                CGuid: existing.CGuid,
                QuotationId: existing.ID,
            };
        });
        // Replace items transactionally
        await prisma.$transaction([
            prisma.quotationItems.deleteMany({ where: { QuotationId: id } }),
            prisma.quotationItems.createMany({ data: itemsData }),
            prisma.quotations.update({
                where: { ID: id },
                data: {
                    CustCode: data.CustCode,
                    CustName: data.CustName || existing.CustName,
                    Address: data.Address !== undefined ? data.Address : existing.Address,
                    CustRefNo: data.CustRefNo !== undefined ? data.CustRefNo : existing.CustRefNo,
                    Currency: data.Currency || existing.Currency,
                    CurRate: data.CurRate != null ? Number(data.CurRate) : existing.CurRate,
                    PostDate: docDate,
                    DueDate: data.DueDate ? new Date(data.DueDate) : existing.DueDate,
                    TaxDate: data.TaxDate ? new Date(data.TaxDate) : existing.TaxDate,
                    Remarks: data.Remarks !== undefined ? data.Remarks : existing.Remarks,
                    Branch_id: data.Branch_id || existing.Branch_id,
                    Status: data.Status || existing.Status,
                    DiscPrcnt: data.DiscPrcnt != null ? Number(data.DiscPrcnt) : existing.DiscPrcnt,
                    Rounding: data.Rounding || existing.Rounding,
                    RoundingAmnt: data.RoundingAmnt != null ? Number(data.RoundingAmnt) : existing.RoundingAmnt,
                    TotalBefDisc: totalBefDisc,
                    TaxTotal: taxTotal,
                    DocTotal: docTotal,
                    SAPDocNum: data.SAPDocNum !== undefined ? data.SAPDocNum : existing.SAPDocNum,
                    SAPDocEntry: data.SAPDocEntry !== undefined ? (data.SAPDocEntry ? Number(data.SAPDocEntry) : null) : existing.SAPDocEntry,
                    UpdatedBy: updatedById,
                    UpdatedDate: new Date(),
                },
            }),
        ]);
        return this.getQuotationById(id);
    }
    /** Delete quotation */
    async deleteQuotation(id) {
        const existing = await prisma.quotations.findUnique({ where: { ID: id } });
        if (!existing)
            throw new NotFoundError('Sales Quotation not found.');
        await prisma.quotationItems.deleteMany({ where: { QuotationId: id } });
        await prisma.quotations.delete({ where: { ID: id } });
        return { success: true, message: 'Sales Quotation deleted successfully.' };
    }
}
