import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';
export class ArInvoiceService {
    /** Get all AR Invoices with search, status, and date range filters */
    async getArInvoices(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            const s = params.status.toLowerCase();
            if (s === 'open' || params.status === 'O') {
                where.Status = { in: ['O', 'Open', 'OPEN'] };
            }
            else if (s === 'closed' || params.status === 'C' || s === 'paid') {
                where.Status = { in: ['C', 'Closed', 'CLOSED', 'Paid', 'PAID'] };
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
                { InvoiceCode: { contains: params.search } },
                { CustCode: { contains: params.search } },
                { CustName: { contains: params.search } },
                { CustRefNo: { contains: params.search } },
                { SAPDocNum: { contains: params.search } },
            ];
        }
        const invoices = await prisma.arInvoice.findMany({
            where,
            orderBy: { ID: 'desc' },
            include: {
                creator: { select: { id: true, FirstName: true, LastName: true } },
                order: { select: { ID: true, OrderCode: true, DocTotal: true } },
                quotation: { select: { ID: true, QuotCode: true, DocTotal: true } },
                items: true,
            },
        });
        // Calculate metrics
        let totalInvoiced = 0;
        let totalPaid = 0;
        const list = invoices.map(inv => {
            const docTotal = Number(inv.DocTotal || 0);
            totalInvoiced += docTotal;
            if (inv.Status === 'C' || inv.Status === 'Paid') {
                totalPaid += docTotal;
            }
            return {
                ...inv,
                CreatedByName: inv.creator ? `${inv.creator.FirstName} ${inv.creator.LastName || ''}`.trim() : null,
                OrderCode: inv.order?.OrderCode || null,
                QuotationCode: inv.quotation?.QuotCode || null,
                itemCount: inv.items?.length || 0,
            };
        });
        return {
            invoices: list,
            metrics: {
                totalInvoiced,
                totalPaid,
                totalBalance: totalInvoiced - totalPaid,
                count: list.length,
            },
        };
    }
    /** Get AR Invoice by ID with line items and relations */
    async getArInvoiceById(id) {
        const invoice = await prisma.arInvoice.findUnique({
            where: { ID: id },
            include: {
                creator: { select: { id: true, FirstName: true, LastName: true } },
                order: {
                    select: { ID: true, OrderCode: true, DocTotal: true, PostDate: true },
                },
                quotation: {
                    select: { ID: true, QuotCode: true, DocTotal: true, PostDate: true },
                },
                items: {
                    include: {
                        Items: true,
                    },
                    orderBy: { LineNum: 'asc' },
                },
            },
        });
        if (!invoice)
            throw new NotFoundError('AR Invoice not found.');
        return {
            ...invoice,
            CreatedByName: invoice.creator ? `${invoice.creator.FirstName} ${invoice.creator.LastName || ''}`.trim() : null,
            OrderCode: invoice.order?.OrderCode || null,
            QuotationCode: invoice.quotation?.QuotCode || null,
        };
    }
    /** Generate unique Invoice code */
    async generateInvoiceCode() {
        const last = await prisma.arInvoice.findFirst({
            orderBy: { ID: 'desc' },
            select: { ID: true },
        });
        const nextNum = (last?.ID || 0) + 1;
        const year = new Date().getFullYear().toString().slice(-2);
        return `INV${year}/${String(nextNum).padStart(4, '0')}`;
    }
    /** Create new AR Invoice */
    async createArInvoice(data, createdById) {
        const cGuid = randomUUID();
        const docDate = data.PostDate ? new Date(data.PostDate) : new Date();
        const invoiceCode = data.InvoiceCode || await this.generateInvoiceCode();
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
                DeliveredQty: quantity,
                OpenQty: 0,
                WhsCode: item.WhsCode != null ? String(item.WhsCode) : null,
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
        const invoice = await prisma.arInvoice.create({
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
                InvoiceCode: invoiceCode,
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
                CreatedDate: docDate,
                CreatedBy: createdById,
                AprStatus: 'Y',
                OrderId: data.OrderId || null,
                QuotationId: data.QuotationId || null,
                VehicleId: data.VehicleId || null,
                DriverName: data.DriverName || null,
                DriverLicenseNo: data.DriverLicenseNo || null,
                TransporterName: data.TransporterName || null,
                CashSales: data.CashSales || 'N',
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: true,
            },
        });
        // If copied from order, close order status
        if (data.OrderId) {
            await prisma.orders.update({
                where: { ID: data.OrderId },
                data: { Status: 'C' },
            }).catch(() => null);
        }
        return invoice;
    }
    /** Update AR Invoice */
    async updateArInvoice(id, data, updatedById) {
        const existing = await prisma.arInvoice.findUnique({
            where: { ID: id },
            include: { items: true },
        });
        if (!existing)
            throw new NotFoundError('AR Invoice not found.');
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
                DeliveredQty: quantity,
                OpenQty: 0,
                WhsCode: item.WhsCode != null ? String(item.WhsCode) : null,
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
                ArInvoiceId: existing.ID,
            };
        });
        await prisma.$transaction([
            prisma.arInvoiceItem.deleteMany({ where: { ArInvoiceId: id } }),
            prisma.arInvoiceItem.createMany({ data: itemsData }),
            prisma.arInvoice.update({
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
                    OrderId: data.OrderId !== undefined ? data.OrderId : existing.OrderId,
                    QuotationId: data.QuotationId !== undefined ? data.QuotationId : existing.QuotationId,
                    VehicleId: data.VehicleId !== undefined ? data.VehicleId : existing.VehicleId,
                    DriverName: data.DriverName !== undefined ? data.DriverName : existing.DriverName,
                    UpdatedBy: updatedById,
                    UpdatedDate: new Date(),
                },
            }),
        ]);
        return this.getArInvoiceById(id);
    }
    /** Delete AR Invoice */
    async deleteArInvoice(id) {
        const existing = await prisma.arInvoice.findUnique({ where: { ID: id } });
        if (!existing)
            throw new NotFoundError('AR Invoice not found.');
        await prisma.arInvoiceItem.deleteMany({ where: { ArInvoiceId: id } });
        await prisma.arInvoice.delete({ where: { ID: id } });
        return { success: true, message: 'AR Invoice deleted successfully.' };
    }
}
