import { ExpenseEntryService } from './expense-entry.service.js';
const expenseEntryService = new ExpenseEntryService();
export class ExpenseEntryController {
    getAll = async (req, res, next) => {
        try {
            const search = req.query.search;
            const entries = await expenseEntryService.getEntries(search);
            res.status(200).json({ status: 'success', data: entries });
        }
        catch (err) {
            next(err);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const entry = await expenseEntryService.getEntryById(id);
            if (!entry) {
                res.status(404).json({ status: 'fail', message: 'Expense entry not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: entry });
        }
        catch (err) {
            next(err);
        }
    };
    create = async (req, res, next) => {
        try {
            const { expenseTypeId, amount, remarks } = req.body;
            const createdById = req.user?.id || 1; // Pull logged-in user ID
            if (!expenseTypeId || amount === undefined) {
                res.status(400).json({ status: 'fail', message: 'expenseTypeId and amount are required' });
                return;
            }
            const entry = await expenseEntryService.createEntry(parseInt(expenseTypeId), parseFloat(amount), remarks, createdById);
            res.status(201).json({ status: 'success', data: entry });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const entry = await expenseEntryService.updateEntry(id, req.body);
            if (!entry) {
                res.status(404).json({ status: 'fail', message: 'Expense entry not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: entry });
        }
        catch (err) {
            next(err);
        }
    };
    delete = async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const success = await expenseEntryService.deleteEntry(id);
            if (!success) {
                res.status(404).json({ status: 'fail', message: 'Expense entry not found or delete failed' });
                return;
            }
            res.status(200).json({ status: 'success', data: null });
        }
        catch (err) {
            next(err);
        }
    };
}
