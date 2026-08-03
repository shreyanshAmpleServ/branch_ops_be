import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service.js';

const tasksService = new TasksService();

export class TasksController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await tasksService.getTasks(req.user!.id);
      res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await tasksService.getTaskById(req.params.id as string, req.user!.id);
      res.status(200).json({ status: 'success', data: { task } });
    } catch (err) {
      next(err);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await tasksService.createTask(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { task } });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await tasksService.updateTask(req.params.id as string, req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { task } });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tasksService.deleteTask(req.params.id as string, req.user!.id);
      res.status(204).json({ status: 'success', data: null });
    } catch (err) {
      next(err);
    }
  };
}
