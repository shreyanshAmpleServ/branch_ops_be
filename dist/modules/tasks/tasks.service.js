import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';
export class TasksService {
    async getTasks(userId) {
        return prisma.task.findMany({
            where: { assignedToId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTaskById(id, userId) {
        const task = await prisma.task.findFirst({
            where: { id, assignedToId: userId },
        });
        if (!task)
            throw new NotFoundError('Task not found.');
        return task;
    }
    async createTask(data, userId) {
        return prisma.task.create({
            data: {
                title: data.title,
                description: data.description || null,
                status: data.status || 'todo',
                priority: data.priority || 'medium',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                assignedToId: userId,
            },
        });
    }
    async updateTask(id, data, userId) {
        await this.getTaskById(id, userId);
        let completedAt = undefined;
        if (data.status === 'done') {
            completedAt = new Date();
        }
        else if (data.status && data.status !== 'done') {
            completedAt = null; // Clear it out
        }
        return prisma.task.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                completedAt,
            },
        });
    }
    async deleteTask(id, userId) {
        await this.getTaskById(id, userId);
        return prisma.task.delete({ where: { id } });
    }
}
