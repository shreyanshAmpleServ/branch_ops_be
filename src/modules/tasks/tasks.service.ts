import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class TasksService {
  public async getTasks(userId: string) {
    return prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getTaskById(id: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: { id, assignedToId: userId },
    });
    if (!task) throw new NotFoundError('Task not found.');
    return task;
  }

  public async createTask(data: any, userId: string) {
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

  public async updateTask(id: string, data: any, userId: string) {
    await this.getTaskById(id, userId);
    
    let completedAt = undefined;
    if (data.status === 'done') {
      completedAt = new Date();
    } else if (data.status && data.status !== 'done') {
      completedAt = null as any; // Clear it out
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

  public async deleteTask(id: string, userId: string) {
    await this.getTaskById(id, userId);
    return prisma.task.delete({ where: { id } });
  }
}
