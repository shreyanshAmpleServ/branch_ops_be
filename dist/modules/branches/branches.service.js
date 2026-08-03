import { prisma } from '../../config/db.js';
export class BranchesService {
    async getBranches(search, activeOnly) {
        let query = "SELECT * FROM dbo.Branches WHERE 1=1";
        const params = [];
        if (activeOnly) {
            query += " AND active = 1";
        }
        if (search) {
            query += " AND (code LIKE ? OR name LIKE ? OR address LIKE ?)";
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }
        // Since mssql driver uses parameter placeholder differently under the hood for $queryRawUnsafe (depends on DB provider, e.g. @p0 or ?), 
        // we can do simple inline parameters or pass parameters safely. In Prisma for SQL Server, it is usually @P1, @P2 etc.
        // Let's do client-side filtering or build safe query:
        try {
            const branches = await prisma.$queryRawUnsafe("SELECT * FROM dbo.Branches ORDER BY code ASC");
            let filtered = branches.map(b => ({
                id: b.id,
                code: b.code ?? '',
                name: b.name ?? '',
                address: b.address ?? '',
                active: b.active === true || b.active === 1 || b.active === '1',
            }));
            if (activeOnly) {
                filtered = filtered.filter(b => b.active);
            }
            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(b => b.code.toLowerCase().includes(s) ||
                    b.name.toLowerCase().includes(s) ||
                    (b.address && b.address.toLowerCase().includes(s)));
            }
            return filtered;
        }
        catch (e) {
            console.error("Error fetching branches:", e);
            return [];
        }
    }
    async getBranchById(id) {
        try {
            const result = await prisma.$queryRawUnsafe("SELECT * FROM dbo.Branches WHERE id = @P1", id);
            if (result.length === 0)
                return null;
            const b = result[0];
            return {
                id: b.id,
                code: b.code ?? '',
                name: b.name ?? '',
                address: b.address ?? '',
                active: b.active === true || b.active === 1 || b.active === '1',
            };
        }
        catch {
            // Fallback
            const all = await this.getBranches();
            return all.find(b => b.id === id) || null;
        }
    }
    async createBranch(code, name, address = '', active = true) {
        const activeVal = active ? 1 : 0;
        await prisma.$executeRawUnsafe("INSERT INTO dbo.Branches (code, name, address, active) VALUES (@P1, @P2, @P3, @P4)", code, name, address, activeVal);
        const result = await prisma.$queryRawUnsafe("SELECT TOP 1 * FROM dbo.Branches ORDER BY id DESC");
        const b = result[0];
        return {
            id: b.id,
            code: b.code ?? '',
            name: b.name ?? '',
            address: b.address ?? '',
            active: b.active === true || b.active === 1 || b.active === '1',
        };
    }
    async updateBranch(id, data) {
        const current = await this.getBranchById(id);
        if (!current)
            return null;
        const code = data.code !== undefined ? data.code : current.code;
        const name = data.name !== undefined ? data.name : current.name;
        const address = data.address !== undefined ? data.address : current.address;
        const activeVal = (data.active !== undefined ? data.active : current.active) ? 1 : 0;
        await prisma.$executeRawUnsafe("UPDATE dbo.Branches SET code = @P1, name = @P2, address = @P3, active = @P4 WHERE id = @P5", code, name, address, activeVal, id);
        return this.getBranchById(id);
    }
    async deleteBranch(id) {
        try {
            await prisma.$executeRawUnsafe("DELETE FROM dbo.Branches WHERE id = @P1", id);
            return true;
        }
        catch {
            return false;
        }
    }
}
