import { Router } from 'express';
import { MasterController } from './master.controller.js';
import { auth } from '../../middleware/auth.middleware.js';

const router = Router();
const masterController = new MasterController();

router.use(auth); // Ensure all master routes require auth

router.get('/areas', masterController.getAreas);
router.get('/warehouses', masterController.getWarehouses);
router.get('/projects', masterController.getProjects);
router.get('/branches', masterController.getBranches);
router.get('/cost-centers', masterController.getCostCenters);
router.get('/cost-centers-main', masterController.getCostCentersMain);
router.get('/accounts', masterController.getAccounts);
router.get('/freight-charges', masterController.getFreightCharges);
router.get('/expenses', masterController.getExpenses);
router.get('/activity-types', masterController.getActivityTypes);
router.get('/activity-statuses', masterController.getActivityStatuses);
router.get('/activity-subjects', masterController.getActivitySubjects);

export default router;
