import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class DealsService {
  public async getDeals(userId: string) {
    return prisma.deal.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getDealById(id: string, userId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, assignedToId: userId },
    });
    if (!deal) throw new NotFoundError('Deal not found.');
    return deal;
  }

  public async createDeal(data: any, userId: string) {
    return prisma.deal.create({
      data: {
        title: data.title,
        value: Number(data.value),
        currency: data.currency || 'USD',
        stage: data.stage || 'discovery',
        probability: data.probability ? Number(data.probability) : 50,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        products: data.products || null,
        assignedToId: userId,
      },
    });
  }

  public async updateDeal(id: string, data: any, userId: string) {
    await this.getDealById(id, userId);
    return prisma.deal.update({
      where: { id },
      data: {
        ...data,
        value: data.value ? Number(data.value) : undefined,
        probability: data.probability ? Number(data.probability) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        actualCloseDate: data.actualCloseDate ? new Date(data.actualCloseDate) : undefined,
      },
    });
  }

  public async deleteDeal(id: string, userId: string) {
    await this.getDealById(id, userId);
    return prisma.deal.delete({ where: { id } });
  }
}
