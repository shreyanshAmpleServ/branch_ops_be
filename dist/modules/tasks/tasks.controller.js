import { TasksService } from './tasks.service.js';
const tasksService = new TasksService();
export class TasksController {
    getAll = async (req, res, next) => {
        try {
            const tasks = await tasksService.getTasks(req.user.id);
            res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const task = await tasksService.getTaskById(req.params.id, req.user.id);
            res.status(200).json({ status: 'success', data: { task } });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const task = await tasksService.createTask(req.body, req.user.id);
            res.status(201).json({ status: 'success', data: { task } });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const task = await tasksService.updateTask(req.params.id, req.body, req.user.id);
            res.status(200).json({ status: 'success', data: { task } });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            await tasksService.deleteTask(req.params.id, req.user.id);
            res.status(204).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
