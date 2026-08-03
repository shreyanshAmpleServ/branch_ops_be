import { BranchesService } from './branches.service.js';
const branchesService = new BranchesService();
export class BranchesController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const activeOnly = req.query.activeOnly === 'true';
            const branches = await branchesService.getBranches(search, activeOnly);
            res.status(200).json({ status: 'success', data: branches });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const branch = await branchesService.getBranchById(id);
            if (!branch) {
                res.status(404).json({ status: 'fail', message: 'Branch not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: branch });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const { code, name, address, active } = req.body;
            if (!code || !name) {
                res.status(400).json({ status: 'fail', message: 'Branch code and name are required' });
                return;
            }
            const branch = await branchesService.createBranch(code, name, address, active);
            res.status(201).json({ status: 'success', data: branch });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const branch = await branchesService.updateBranch(id, req.body);
            if (!branch) {
                res.status(404).json({ status: 'fail', message: 'Branch not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: branch });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const success = await branchesService.deleteBranch(id);
            if (!success) {
                res.status(404).json({ status: 'fail', message: 'Branch not found or delete failed' });
                return;
            }
            res.status(200).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
