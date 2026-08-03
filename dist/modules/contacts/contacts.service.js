import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';
export class ContactsService {
    async getContacts(userId) {
        return prisma.contact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getContactById(id, userId) {
        const contact = await prisma.contact.findFirst({
            where: { id, userId },
        });
        if (!contact) {
            throw new NotFoundError('Contact not found.');
        }
        return contact;
    }
    async createContact(data, userId) {
        return prisma.contact.create({
            data: {
                ...data,
                userId,
            },
        });
    }
    async updateContact(id, data, userId) {
        // Ensure contact exists and belongs to user
        await this.getContactById(id, userId);
        return prisma.contact.update({
            where: { id },
            data,
        });
    }
    async deleteContact(id, userId) {
        await this.getContactById(id, userId);
        return prisma.contact.delete({
            where: { id },
        });
    }
}
