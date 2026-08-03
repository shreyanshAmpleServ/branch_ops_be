import { prisma } from '../../config/db.js';
export class ExpenseEntryService {
    async getEntries(search) {
        try {
            const rows = await prisma.$queryRawUnsafe(`
        SELECT ee.id, ee.expenseDate, ee.expenseTypeId, ee.amount, ee.remarks, ee.createdById, e.expenseType 
        FROM dbo.ExpenseEntries ee
        LEFT JOIN dbo.Expenses e ON ee.expenseTypeId = e.id
        ORDER BY ee.expenseDate DESC, ee.id DESC
      `);
            let mapped = rows.map(r => ({
                id: r.id,
                expenseDate: r.expenseDate ? new Date(r.expenseDate).toISOString().split('T')[0] : '',
                expenseTypeId: r.expenseTypeId,
                expenseType: r.expenseType ?? 'General',
                amount: Number(r.amount),
                remarks: r.remarks ?? '',
                createdById: r.createdById,
            }));
            if (search) {
                const s = search.toLowerCase();
                mapped = mapped.filter(r => r.expenseType.toLowerCase().includes(s) ||
                    (r.remarks && r.remarks.toLowerCase().includes(s)));
            }
            return mapped;
        }
        catch (e) {
            console.error('Error fetching ExpenseEntries:', e);
            return [];
        }
    }
    async getEntryById(id) {
        try {
            const rows = await prisma.$queryRawUnsafe(`
        SELECT ee.id, ee.expenseDate, ee.expenseTypeId, ee.amount, ee.remarks, ee.createdById, e.expenseType 
        FROM dbo.ExpenseEntries ee
        LEFT JOIN dbo.Expenses e ON ee.expenseTypeId = e.id
        WHERE ee.id = @P1
      `, id);
            if (rows.length === 0)
                return null;
            const r = rows[0];
            return {
                id: r.id,
                expenseDate: r.expenseDate ? new Date(r.expenseDate).toISOString().split('T')[0] : '',
                expenseTypeId: r.expenseTypeId,
                expenseType: r.expenseType ?? 'General',
                amount: Number(r.amount),
                remarks: r.remarks ?? '',
                createdById: r.createdById,
            };
        }
        catch (e) {
            console.error('Error fetching ExpenseEntry:', e);
            return null;
        }
    }
    async createEntry(expenseTypeId, amount, remarks = '', createdById) {
        try {
            await prisma.$executeRawUnsafe("INSERT INTO dbo.ExpenseEntries (expenseTypeId, amount, remarks, createdById) VALUES (@P1, @P2, @P3, @P4)", expenseTypeId, amount, remarks, createdById);
            const result = await prisma.$queryRawUnsafe("SELECT TOP 1 id FROM dbo.ExpenseEntries ORDER BY id DESC");
            if (result.length === 0)
                return null;
            return this.getEntryById(result[0].id);
        }
        catch (e) {
            console.error('Error creating ExpenseEntry:', e);
            return null;
        }
    }
    async updateEntry(id, data) {
        const current = await this.getEntryById(id);
        if (!current)
            return null;
        const expenseTypeId = data.expenseTypeId !== undefined ? data.expenseTypeId : current.expenseTypeId;
        const amount = data.amount !== undefined ? data.amount : current.amount;
        const remarks = data.remarks !== undefined ? data.remarks : current.remarks;
        try {
            await prisma.$executeRawUnsafe("UPDATE dbo.ExpenseEntries SET expenseTypeId = @P1, amount = @P2, remarks = @P3 WHERE id = @P4", expenseTypeId, amount, remarks, id);
            return this.getEntryById(id);
        }
        catch (e) {
            console.error('Error updating ExpenseEntry:', e);
            return null;
        }
    }
    async deleteEntry(id) {
        try {
            await prisma.$executeRawUnsafe("DELETE FROM dbo.ExpenseEntries WHERE id = @P1", id);
            return true;
        }
        catch (e) {
            console.error('Error deleting ExpenseEntry:', e);
            return false;
        }
    }
}
