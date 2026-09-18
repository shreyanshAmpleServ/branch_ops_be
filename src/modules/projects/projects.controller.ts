import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service.js';

const projectsService = new ProjectsService();

export class ProjectsController {
  /** GET /api/projects — list projects with stats and filter */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, status, stage, branchId } = req.query;
      const result = await projectsService.getProjects({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string | undefined,
        status: status as string | undefined,
        stage: stage as string | undefined,
        branchId: branchId ? Number(branchId) : undefined,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/projects/analytics — executive analytics */
  public getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await projectsService.getAnalytics();
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/projects/finance — stage financial progress */
  public getFinance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await projectsService.getFinance();
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/projects/:id — single project */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const project = await projectsService.getProjectById(id);
      res.status(200).json({
        status: 'success',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/projects — create project */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectsService.createProject(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Project created successfully',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/projects/:id — update project */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const project = await projectsService.updateProject(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Project updated successfully',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /api/projects/:id — delete project */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const result = await projectsService.deleteProject(id);
      res.status(200).json({
        status: 'success',
        message: 'Project deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
