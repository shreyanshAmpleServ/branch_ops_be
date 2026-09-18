import { prisma } from '../../config/db.js';
import { randomUUID } from 'crypto';
import { NotFoundError } from '../../utils/appError.js';
export class ApInvoiceService {
    /** Get all AP invoices with filters */
    async getApInvoices(params) {
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
        if (params.typeRequest) {
            const tr = params.typeRequest.toLowerCase();
            where.OR = [
                { TypeRequest: { equals: tr } },
                { RequestType: { equals: tr } },
            ];
        }
        if (params.startDate || params.endDate) {
            where.PostDate = {};
            if (params.startDate)
                where.PostDate.gte = new Date(params.startDate);
            if (params.endDate)
                where.PostDate.lte = new Date(params.endDate);
        }
        if (params.search) {
            const q = params.search;
            where.OR = [
                { OrderCode: { contains: q } },
                { CustCode: { contains: q } },
                { CustName: { contains: q } },
                { RequestedNo: { contains: q } },
                { purchaseOrder: { contains: q } },
                { Remarks: { contains: q } },
            ];
        }
        const invoices = await prisma.apInvoice.findMany({
            where,
            orderBy: { CreatedDate: 'desc' },
        });
        // Resolve user & creator IDs
        const userIds = Array.from(new Set(invoices
            .map(inv => {
            const numCust = !isNaN(Number(inv.CustCode)) ? Number(inv.CustCode) : null;
            return [inv.CreatedBy, numCust].filter((id) => id !== null && id !== undefined);
        })
            .flat()));
        let userMap = {};
        if (userIds.length > 0) {
            const users = await prisma.users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, FirstName: true, LastName: true }
            });
            for (const u of users) {
                userMap[u.id] = `${u.FirstName} ${u.LastName || ''}`.trim();
            }
        }
        // Resolve customer names from Retailers
        const custCodes = invoices.map(i => i.CustCode).filter(Boolean);
        if (custCodes.length > 0) {
            try {
                const retailers = await prisma.retailers.findMany({
                    where: { Code: { in: custCodes } },
                    select: { Code: true, Name: true },
                });
                const retMap = Object.fromEntries(retailers.map(r => [r.Code, r.Name]));
                invoices.forEach(inv => {
                    if (inv.CustCode && retMap[inv.CustCode] && (!inv.CustName || inv.CustName === inv.CustCode)) {
                        inv.CustName = retMap[inv.CustCode];
                    }
                });
            }
            catch (e) {
                // Retailers lookup fallback
            }
        }
        // Batch load items
        const allCguids = invoices.map(i => i.CGuid).filter(Boolean);
        const itemsMap = {};
        if (allCguids.length > 0) {
            const allItems = await prisma.apInvoiceItem.findMany({
                where: { mainCguid: { in: allCguids } },
                orderBy: { LineNum: 'asc' },
            });
            for (const itm of allItems) {
                if (itm.mainCguid) {
                    if (!itemsMap[itm.mainCguid])
                        itemsMap[itm.mainCguid] = [];
                    itemsMap[itm.mainCguid].push(itm);
                }
            }
        }
        return invoices.map(inv => ({
            ...inv,
            items: itemsMap[inv.CGuid] || [],
            CreatedByName: inv.CreatedBy ? userMap[inv.CreatedBy] : null,
            CustName: !isNaN(Number(inv.CustCode)) && userMap[Number(inv.CustCode)] ? userMap[Number(inv.CustCode)] : inv.CustName
        }));
    }
    /** Get single AP Invoice details by ID */
    async getApInvoiceById(id) {
        const invoice = await prisma.apInvoice.findUnique({
            where: { ID: id },
        });
        if (!invoice)
            return null;
        let createdByName = null;
        if (invoice.CreatedBy) {
            const user = await prisma.users.findUnique({
                where: { id: invoice.CreatedBy },
                select: { id: true, FirstName: true, LastName: true }
            });
            if (user) {
                createdByName = `${user.FirstName} ${user.LastName || ''}`.trim();
            }
        }
        // Line items associated via mainCguid or CGuid
        const items = await prisma.apInvoiceItem.findMany({
            where: {
                OR: [
                    { mainCguid: invoice.CGuid },
                    { CGuid: invoice.CGuid },
                ]
            },
            orderBy: { LineNum: 'asc' },
        });
        // Attachments
        const rawAttachments = await prisma.apInvoiceAttachment.findMany({
            where: { CGuid: invoice.CGuid },
            orderBy: { LineNum: 'asc' },
        });
        const attachments = rawAttachments.map(att => ({
            ID: att.ID,
            LineNum: att.LineNum,
            CGuid: att.CGuid,
            Attachment: att.Attachment || '',
        }));
        return {
            ...invoice,
            CreatedByName: createdByName || null,
            items,
            attachments,
        };
    }
    /** Create new AP Invoice */
    async createApInvoice(data, createdById) {
        const cGuid = randomUUID();
        const docDate = data.PostDate ? new Date(data.PostDate) : new Date();
        let totalBefDisc = 0;
        let taxTotal = 0;
        let docTotal = 0;
        const itemsData = (data.items || []).map((item, idx) => {
            const quantity = Number(item.Quantity || 1);
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
                ItemID: item.ItemID || 0,
                ItemCode: item.ItemCode || (data.TypeRequest === 'Service' ? 'SERVICE' : null),
                ItemName: item.ItemName || item.Remarks || null,
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
                LineTotalFC: lineTotalLC,
                LineTotalSC: lineTotalLC,
                cost_center: item.cost_center || null,
                project: item.project || null,
                DIM1: item.DIM1 || null,
                DIM2: item.DIM2 || null,
                DIM3: item.DIM3 || null,
                DIM4: item.DIM4 || null,
                DIM5: item.DIM5 || null,
                Remarks: item.Remarks || null,
                UoM: item.UoM || (data.TypeRequest === 'Service' ? 'svc' : 'pcs'),
                vendor: item.vendor || data.CustCode || null,
                Location: item.Location || null,
                ferightType: item.ferightType || null,
                vendorRef: item.vendorRef || null,
                SourceDocId: item.SourceDocId ? String(item.SourceDocId) : null,
                SourceLineNum: item.SourceLineNum ? Number(item.SourceLineNum) : null,
                SourceDocType: item.SourceDocType || null,
                CGuid: randomUUID(),
                mainCguid: cGuid,
            };
        });
        const discPrcntDoc = Number(data.DiscPrcnt || 0);
        const freightDoc = Number(data.Freight || 0);
        const roundingAmntDoc = Number(data.RoundingAmnt || 0);
        const docTotalAfterDocDisc = docTotal * (1 - discPrcntDoc / 100) + freightDoc + roundingAmntDoc;
        // Auto-generate invoice code if missing
        let orderCode = data.OrderCode;
        if (!orderCode) {
            const year = new Date().getFullYear().toString().slice(-2);
            const count = await prisma.apInvoice.count();
            orderCode = `INV${year}/${count + 1}`;
        }
        const createdInvoice = await prisma.apInvoice.create({
            data: {
                PostDate: docDate,
                DueDate: data.DueDate ? new Date(data.DueDate) : null,
                PODate: data.PODate ? new Date(data.PODate) : docDate,
                DeliveryDate: data.DeliveryDate ? new Date(data.DeliveryDate) : null,
                CustCode: data.CustCode,
                CustName: data.CustName || null,
                OrderCode: orderCode,
                RequestedNo: data.RequestedNo || null,
                purchaseOrder: data.purchaseOrder || null,
                relation_from: data.relation_from || null,
                Branch_id: data.Branch_id ? Number(data.Branch_id) : null,
                RequestType: data.RequestType || 'Direct',
                TypeRequest: data.TypeRequest || 'Item',
                TypePayment: data.TypePayment || 'Cash',
                Department: data.Department || null,
                ExpenseType: data.ExpenseType || null,
                Remarks: data.Remarks || null,
                DiscPrcnt: discPrcntDoc,
                Freight: freightDoc,
                Rounding: data.Rounding || 'N',
                RoundingAmnt: roundingAmntDoc,
                TotalBefDisc: totalBefDisc,
                TaxTotal: taxTotal,
                DocTotal: docTotalAfterDocDisc,
                DocTotalFC: docTotalAfterDocDisc,
                DocTotalSC: docTotalAfterDocDisc,
                Status: 'O',
                CGuid: cGuid,
                CreatedDate: new Date(),
                CreatedBy: createdById,
                DMLFlag: 1,
            },
        });
        // Create line items
        if (itemsData.length > 0) {
            await prisma.apInvoiceItem.createMany({
                data: itemsData,
            });
        }
        // Create attachments
        if (data.attachments && data.attachments.length > 0) {
            const attachmentsData = data.attachments.map((att, idx) => ({
                LineNum: idx + 1,
                Attachment: att.Attachment,
                CGuid: cGuid,
            }));
            await prisma.apInvoiceAttachment.createMany({
                data: attachmentsData,
            });
        }
        return this.getApInvoiceById(createdInvoice.ID);
    }
    /** Update AP Invoice */
    async updateApInvoice(id, data, updatedById) {
        const existing = await prisma.apInvoice.findUnique({
            where: { ID: id },
        });
        if (!existing) {
            throw new NotFoundError('AP Invoice not found');
        }
        const cGuid = existing.CGuid;
        const docDate = data.PostDate ? new Date(data.PostDate) : existing.PostDate;
        let totalBefDisc = 0;
        let taxTotal = 0;
        let docTotal = 0;
        const itemsData = (data.items || []).map((item, idx) => {
            const quantity = Number(item.Quantity || 1);
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
                ItemID: item.ItemID || 0,
                ItemCode: item.ItemCode || (data.TypeRequest === 'Service' ? 'SERVICE' : null),
                ItemName: item.ItemName || item.Remarks || null,
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
                LineTotalFC: lineTotalLC,
                LineTotalSC: lineTotalLC,
                cost_center: item.cost_center || null,
                project: item.project || null,
                DIM1: item.DIM1 || null,
                DIM2: item.DIM2 || null,
                DIM3: item.DIM3 || null,
                DIM4: item.DIM4 || null,
                DIM5: item.DIM5 || null,
                Remarks: item.Remarks || null,
                UoM: item.UoM || (data.TypeRequest === 'Service' ? 'svc' : 'pcs'),
                vendor: item.vendor || data.CustCode || null,
                Location: item.Location || null,
                ferightType: item.ferightType || null,
                vendorRef: item.vendorRef || null,
                SourceDocId: item.SourceDocId ? String(item.SourceDocId) : null,
                SourceLineNum: item.SourceLineNum ? Number(item.SourceLineNum) : null,
                SourceDocType: item.SourceDocType || null,
                CGuid: randomUUID(),
                mainCguid: cGuid,
            };
        });
        const discPrcntDoc = Number(data.DiscPrcnt || 0);
        const freightDoc = Number(data.Freight || 0);
        const roundingAmntDoc = Number(data.RoundingAmnt || 0);
        const docTotalAfterDocDisc = docTotal * (1 - discPrcntDoc / 100) + freightDoc + roundingAmntDoc;
        await prisma.apInvoice.update({
            where: { ID: id },
            data: {
                PostDate: docDate,
                DueDate: data.DueDate ? new Date(data.DueDate) : existing.DueDate,
                PODate: data.PODate ? new Date(data.PODate) : existing.PODate,
                DeliveryDate: data.DeliveryDate ? new Date(data.DeliveryDate) : existing.DeliveryDate,
                CustCode: data.CustCode,
                CustName: data.CustName || null,
                OrderCode: data.OrderCode || existing.OrderCode,
                RequestedNo: data.RequestedNo || null,
                purchaseOrder: data.purchaseOrder || null,
                relation_from: data.relation_from || null,
                Branch_id: data.Branch_id ? Number(data.Branch_id) : null,
                RequestType: data.RequestType || existing.RequestType,
                TypeRequest: data.TypeRequest || existing.TypeRequest,
                TypePayment: data.TypePayment || existing.TypePayment,
                Department: data.Department || null,
                ExpenseType: data.ExpenseType || null,
                Remarks: data.Remarks || null,
                DiscPrcnt: discPrcntDoc,
                Freight: freightDoc,
                Rounding: data.Rounding || 'N',
                RoundingAmnt: roundingAmntDoc,
                TotalBefDisc: totalBefDisc,
                TaxTotal: taxTotal,
                DocTotal: docTotalAfterDocDisc,
                DocTotalFC: docTotalAfterDocDisc,
                DocTotalSC: docTotalAfterDocDisc,
                UpdatedDate: new Date(),
                UpdatedBy: updatedById,
            },
        });
        // Replace items
        await prisma.apInvoiceItem.deleteMany({
            where: {
                OR: [
                    { mainCguid: cGuid },
                    { CGuid: cGuid },
                ]
            },
        });
        if (itemsData.length > 0) {
            await prisma.apInvoiceItem.createMany({
                data: itemsData,
            });
        }
        // Replace attachments
        if (data.attachments) {
            await prisma.apInvoiceAttachment.deleteMany({
                where: { CGuid: cGuid },
            });
            if (data.attachments.length > 0) {
                const attachmentsData = data.attachments.map((att, idx) => ({
                    LineNum: idx + 1,
                    Attachment: att.Attachment,
                    CGuid: cGuid,
                }));
                await prisma.apInvoiceAttachment.createMany({
                    data: attachmentsData,
                });
            }
        }
        return this.getApInvoiceById(id);
    }
    /** Delete AP Invoice */
    async deleteApInvoice(id) {
        const existing = await prisma.apInvoice.findUnique({
            where: { ID: id },
        });
        if (!existing) {
            throw new NotFoundError('AP Invoice not found');
        }
        // Delete associated lines & attachments
        await prisma.apInvoiceItem.deleteMany({
            where: {
                OR: [
                    { mainCguid: existing.CGuid },
                    { CGuid: existing.CGuid },
                ]
            },
        });
        await prisma.apInvoiceAttachment.deleteMany({
            where: { CGuid: existing.CGuid },
        });
        return prisma.apInvoice.delete({
            where: { ID: id },
        });
    }
}
export const apInvoiceService = new ApInvoiceService();
