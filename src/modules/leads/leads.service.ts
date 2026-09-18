import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class LeadsService {
  public async getLeads(userId: any) {
    return (prisma as any).lead.findMany({
      where: { assignedToId: userId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getLeadById(id: any, userId: any) {
    const lead = await (prisma as any).lead.findFirst({
      where: { id, assignedToId: userId },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundError('Lead not found.');
    return lead;
  }

  public async createLead(data: any, userId: any) {
    return (prisma as any).lead.create({
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

  public async updateLead(id: any, data: any, userId: any) {
    await this.getLeadById(id, userId);
    return (prisma as any).lead.update({
      where: { id },
      data: {
        ...data,
        value: data.value ? Number(data.value) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
    });
  }

  public async deleteLead(id: any, userId: any) {
    await this.getLeadById(id, userId);
    return (prisma as any).lead.delete({ where: { id } });
  }
}
