import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class ContactsService {
  public async getContacts(userId: any) {
    return (prisma as any).contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getContactById(id: any, userId: any) {
    const contact = await (prisma as any).contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found.');
    }

    return contact;
  }

  public async createContact(data: any, userId: any) {
    return (prisma as any).contact.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  public async updateContact(id: any, data: any, userId: any) {
    // Ensure contact exists and belongs to user
    await this.getContactById(id, userId);

    return (prisma as any).contact.update({
      where: { id },
      data,
    });
  }

  public async deleteContact(id: any, userId: any) {
    await this.getContactById(id, userId);

    return (prisma as any).contact.delete({
      where: { id },
    });
  }
}
