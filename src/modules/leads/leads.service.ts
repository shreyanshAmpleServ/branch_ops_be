import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class LeadsService {
  public async getLeads(userId: string) {
    return prisma.lead.findMany({
      where: { assignedToId: userId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getLeadById(id: string, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, assignedToId: userId },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundError('Lead not found.');
    return lead;
  }

  public async createLead(data: any, userId: string) {
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

  public async updateLead(id: string, data: any, userId: string) {
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

  public async deleteLead(id: string, userId: string) {
    await this.getLeadById(id, userId);
    return prisma.lead.delete({ where: { id } });
  }
}
