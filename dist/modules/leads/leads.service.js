import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';
export class LeadsService {
    async getLeads(userId) {
        return prisma.lead.findMany({
            where: { assignedToId: userId },
            include: { contact: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getLeadById(id, userId) {
        const lead = await prisma.lead.findFirst({
            where: { id, assignedToId: userId },
            include: { contact: true },
        });
        if (!lead)
            throw new NotFoundError('Lead not found.');
        return lead;
    }
    async createLead(data, userId) {
        return prisma.lead.create({
            data: {
                title: data.title,
                value: Number(data.value),
                currency: data.currency || 'USD',
                stage: data.stage || 'new',
                priority: data.priority || 'medium',
                source: data.source || 'website',
                contactId: data.contactId || null,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
                assignedToId: userId,
            },
        });
    }
    async updateLead(id, data, userId) {
        await this.getLeadById(id, userId);
        return prisma.lead.update({
            where: { id },
            data: {
                ...data,
                value: data.value ? Number(data.value) : undefined,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
            },
        });
    }
    async deleteLead(id, userId) {
        await this.getLeadById(id, userId);
        return prisma.lead.delete({ where: { id } });
    }
}
