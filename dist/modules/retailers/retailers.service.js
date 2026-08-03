import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';
export class RetailersService {
    /**
     * Paginated, filtered list of retailers (Customers/Suppliers)
     */
    async getRetailers(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 20));
        const skip = (page - 1) * limit;
        const where = {
            CardType: params.cardType,
        };
        // Filter by approval status
        if (params.aprStatus && params.aprStatus !== 'all') {
            where.AprStatus = params.aprStatus;
        }
        // Filter by CreatedDate range
        if (params.startDate || params.endDate) {
            where.CreatedDate = {};
            if (params.startDate) {
                where.CreatedDate.gte = new Date(params.startDate);
            }
            if (params.endDate) {
                const end = new Date(params.endDate);
                end.setHours(23, 59, 59, 999);
                where.CreatedDate.lte = end;
            }
        }
        // Search filter
        if (params.search) {
            const term = params.search.trim();
            where.OR = [
                { Code: { contains: term } },
                { Name: { contains: term } },
                { Address: { contains: term } },
                { Owner: { contains: term } },
                { OwnerMobileNo: { contains: term } },
                { OwnerEmail: { contains: term } },
                { Route: { contains: term } },
            ];
        }
        const [total, data] = await Promise.all([
            prisma.retailers.count({ where }),
            prisma.retailers.findMany({
                where,
                orderBy: { CreatedDate: 'desc' },
                skip,
                take: limit,
            }),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get single Retailer details including Contacts & Addresses
     */
    async getRetailerById(id) {
        const retailer = await prisma.retailers.findUnique({
            where: { ID: id },
        });
        if (!retailer) {
            throw new NotFoundError('Retailer not found');
        }
        // Query contacts and addresses separately using Retailer Code
        let contacts = [];
        let addresses = [];
        if (retailer.Code) {
            [contacts, addresses] = await Promise.all([
                prisma.retailerContacts.findMany({
                    where: { RetailerId: retailer.Code },
                }),
                prisma.retailerAddress.findMany({
                    where: { RetailerID: retailer.Code },
                }),
            ]);
        }
        return {
            ...retailer,
            contacts,
            addresses,
        };
    }
    /**
     * Update Retailer (including custom coordinates)
     */
    async updateRetailer(id, data) {
        const retailer = await prisma.retailers.findUnique({ where: { ID: id } });
        if (!retailer) {
            throw new NotFoundError('Retailer not found');
        }
        const updateFields = {};
        if (data.name !== undefined)
            updateFields.Name = data.name;
        if (data.address !== undefined)
            updateFields.Address = data.address;
        if (data.owner !== undefined)
            updateFields.Owner = data.owner;
        if (data.ownerMobileNo !== undefined)
            updateFields.OwnerMobileNo = data.ownerMobileNo;
        if (data.ownerEmail !== undefined)
            updateFields.OwnerEmail = data.ownerEmail;
        if (data.tin !== undefined)
            updateFields.TIN = data.tin;
        if (data.vat !== undefined)
            updateFields.VAT = data.vat;
        if (data.crLimit !== undefined)
            updateFields.CrLimit = data.crLimit;
        if (data.dueDate !== undefined)
            updateFields.DueDate = data.dueDate ? new Date(data.dueDate) : null;
        if (data.paymentTerms !== undefined)
            updateFields.PaymentTerms = data.paymentTerms;
        if (data.latitude !== undefined)
            updateFields.Latitude = data.latitude;
        if (data.longitude !== undefined)
            updateFields.Longitude = data.longitude;
        updateFields.updated_at = new Date();
        const updated = await prisma.retailers.update({
            where: { ID: id },
            data: updateFields,
        });
        return this.getRetailerById(updated.ID);
    }
    /**
     * Approve or reject a retailer
     */
    async approveRetailer(id, aprStatus, remark, approvedBy) {
        const retailer = await prisma.retailers.findUnique({ where: { ID: id } });
        if (!retailer) {
            throw new NotFoundError('Retailer not found');
        }
        const updated = await prisma.retailers.update({
            where: { ID: id },
            data: {
                AprStatus: aprStatus,
                AprRemark: remark,
                AprDate: new Date(),
                AprBy: approvedBy,
                IsApproved: aprStatus === 'Y' ? 'Y' : 'N',
                ApprovedBy: aprStatus === 'Y' ? 1 : 0,
            },
        });
        return this.getRetailerById(updated.ID);
    }
    /**
     * Get open orders for a customer/supplier
     */
    async getRetailerOrders(code) {
        return prisma.orders.findMany({
            where: {
                CustCode: code,
            },
            orderBy: {
                CreatedDate: 'desc',
            },
            take: 100,
        });
    }
    /**
     * Get notes/activities for a customer/supplier
     */
    async getRetailerNotes(code) {
        return prisma.activities.findMany({
            where: {
                BPCode: code,
            },
            orderBy: {
                StartDate: 'desc',
            },
            take: 100,
        });
    }
    async getRetailerComplaints(code) {
        try {
            return await prisma.$queryRaw `
        SELECT * FROM CustomerFeedback 
        WHERE CustomerCode = ${code} 
        ORDER BY Date DESC
      `;
        }
        catch {
            return [];
        }
    }
    /**
     * Delete a retailer record
     */
    async deleteRetailer(id) {
        const retailer = await prisma.retailers.findUnique({ where: { ID: id } });
        if (!retailer) {
            throw new NotFoundError('Retailer not found');
        }
        // Delete associated contacts and addresses if any exist
        if (retailer.Code) {
            await Promise.all([
                prisma.retailerContacts.deleteMany({ where: { RetailerId: retailer.Code } }),
                prisma.retailerAddress.deleteMany({ where: { RetailerID: retailer.Code } })
            ]);
        }
        return prisma.retailers.delete({ where: { ID: id } });
    }
}
