import { ProjectsService } from './projects.service.js';
const projectsService = new ProjectsService();
export class ProjectsController {
    /** GET /api/projects — list projects with stats and filter */
    getAll = async (req, res, next) => {
        try {
            const { page, limit, search, status, stage, branchId } = req.query;
            const result = await projectsService.getProjects({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                search: search,
                status: status,
                stage: stage,
                branchId: branchId ? Number(branchId) : undefined,
            });
            res.status(200).json({
                status: 'success',
                ...result,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** GET /api/projects/analytics — executive analytics */
    getAnalytics = async (req, res, next) => {
        try {
            const result = await projectsService.getAnalytics();
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** GET /api/projects/finance — stage financial progress */
    getFinance = async (req, res, next) => {
        try {
            const result = await projectsService.getFinance();
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** GET /api/projects/:id — single project */
    getById = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            const project = await projectsService.getProjectById(id);
            res.status(200).json({
                status: 'success',
                data: project,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** POST /api/projects — create project */
    create = async (req, res, next) => {
        try {
            const project = await projectsService.createProject(req.body);
            res.status(201).json({
                status: 'success',
                message: 'Project created successfully',
                data: project,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** PUT /api/projects/:id — update project */
    update = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            const project = await projectsService.updateProject(id, req.body);
            res.status(200).json({
                status: 'success',
                message: 'Project updated successfully',
                data: project,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /** DELETE /api/projects/:id — delete project */
    delete = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            const result = await projectsService.deleteProject(id);
            res.status(200).json({
                status: 'success',
                message: 'Project deleted successfully',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
