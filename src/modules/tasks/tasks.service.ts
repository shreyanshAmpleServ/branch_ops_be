import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

export class TasksService {
  public async getTasks(userId: any) {
    return (prisma as any).task.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getTaskById(id: any, userId: any) {
    const task = await (prisma as any).task.findFirst({
      where: { id, assignedToId: userId },
    });
    if (!task) throw new NotFoundError('Task not found.');
    return task;
  }

  public async createTask(data: any, userId: any) {
    return (prisma as any).task.create({
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

  public async updateTask(id: any, data: any, userId: any) {
    await this.getTaskById(id, userId);
    
    let completedAt = undefined;
    if (data.status === 'done') {
      completedAt = new Date();
    } else if (data.status && data.status !== 'done') {
      completedAt = null as any; // Clear it out
    }

    return (prisma as any).task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt,
      },
    });
  }

  public async deleteTask(id: any, userId: any) {
    await this.getTaskById(id, userId);
    return (prisma as any).task.delete({ where: { id } });
  }
}
