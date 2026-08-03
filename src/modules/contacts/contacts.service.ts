import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class ContactsService {
  public async getContacts(userId: string) {
    return prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getContactById(id: string, userId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found.');
    }

    return contact;
  }

  public async createContact(data: any, userId: string) {
    return prisma.contact.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  public async updateContact(id: string, data: any, userId: string) {
    // Ensure contact exists and belongs to user
    await this.getContactById(id, userId);

    return prisma.contact.update({
      where: { id },
      data,
    });
  }

  public async deleteContact(id: string, userId: string) {
    await this.getContactById(id, userId);

    return prisma.contact.delete({
      where: { id },
    });
  }
}
