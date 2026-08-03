import { MasterService } from './master.service.js';
const masterService = new MasterService();
export class MasterController {
    getAreas = async (req, res, next) => {
        try {
            const data = await masterService.getAreas();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getWarehouses = async (req, res, next) => {
        try {
            const data = await masterService.getWarehouses();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getProjects = async (req, res, next) => {
        try {
            const data = await masterService.getProjects();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getBranches = async (req, res, next) => {
        try {
            const data = await masterService.getBranches();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getCostCenters = async (req, res, next) => {
        try {
            const data = await masterService.getCostCenters();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getCostCentersMain = async (req, res, next) => {
        try {
            const data = await masterService.getCostCentersMain();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getAccounts = async (req, res, next) => {
        try {
            const data = await masterService.getAccounts();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getFreightCharges = async (req, res, next) => {
        try {
            const data = await masterService.getFreightCharges();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getExpenses = async (req, res, next) => {
        try {
            const data = await masterService.getExpenses();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getActivityTypes = async (req, res, next) => {
        try {
            const data = await masterService.getActivityTypes();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getActivityStatuses = async (req, res, next) => {
        try {
            const data = await masterService.getActivityStatuses();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
    getActivitySubjects = async (req, res, next) => {
        try {
            const data = await masterService.getActivitySubjects();
            res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    };
}
