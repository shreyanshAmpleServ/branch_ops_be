import { prisma } from '../../config/db.js';

export interface MasterItem {
  id: number;
  code: string;
  name: string;
}

export class MasterService {
  public async getAreas(): Promise<MasterItem[]> {
    try {
      const areas: any[] = await prisma.$queryRawUnsafe("SELECT * FROM Areas");
      return areas.map(a => ({
        id: a.ID,
        code: a.AreaCode ?? '',
        name: a.AreaCode ?? '',
      }));
    } catch {
      // Fallback using prisma client model
      const areas = await prisma.areas.findMany({
        select: { ID: true, AreaCode: true },
      });
      return areas.map(a => ({
        id: a.ID,
        code: a.AreaCode ?? '',
        name: a.AreaCode ?? '',
      }));
    }
  }

  public async getWarehouses(): Promise<MasterItem[]> {
    try {
      const warehouses: any[] = await prisma.$queryRawUnsafe("SELECT * FROM Warehouses");
      return warehouses.map(w => ({
        id: w.ID,
        code: w.Code ?? '',
        name: w.Name ?? '',
      }));
    } catch {
      const warehouses = await prisma.warehouses.findMany({
        select: { ID: true, Code: true, Name: true },
      });
      return warehouses.map(w => ({
        id: w.ID,
        code: w.Code ?? '',
        name: w.Name ?? '',
      }));
    }
  }

  public async getProjects(): Promise<MasterItem[]> {
    try {
      const projects: any[] = await prisma.$queryRawUnsafe("SELECT * FROM getProjectData");
      return projects.map((p, idx) => ({
        id: idx + 1,
        code: p.Code ?? '',
        name: p.Name ?? '',
      }));
    } catch {
      try {
        const fallback: any[] = await prisma.$queryRaw`SELECT ID, Code, Name FROM Projects`;
        return fallback.map(p => ({
          id: p.ID,
          code: p.Code ?? '',
          name: p.Name ?? '',
        }));
      } catch {
        return [];
      }
    }
  }

  public async getBranches(): Promise<MasterItem[]> {
    try {
      const branches: any[] = await prisma.$queryRawUnsafe("SELECT * FROM dbo.Branches WHERE active = 1 ORDER BY code ASC");
      return branches.map(b => ({
        id: b.id,
        code: b.code ?? '',
        name: b.name ?? '',
      }));
    } catch {
      try {
        const branches: any[] = await prisma.$queryRawUnsafe("Select * from DCC_APP_GetBranch");
        return branches.map(b => ({
          id: b.BPLId,
          code: String(b.BPLId),
          name: b.BPLName ?? '',
        }));
      } catch {
        return [
          { id: 1, code: 'B001', name: 'Dcc_branch' },
          { id: 2, code: 'B002', name: 'HQ' },
        ];
      }
    }
  }

  public async getCostCenters(): Promise<MasterItem[]> {
    try {
      const costCenters: any[] = await prisma.$queryRawUnsafe("SELECT * FROM DCC_getCostCenter Where DimActive ='Y'");
      return costCenters.map((cc, idx) => ({
        id: idx + 1,
        code: String(cc.DimCode ?? cc.PrcCode ?? cc.Code ?? ''),
        name: cc.DimName ?? cc.PrcName ?? cc.Name ?? '',
      }));
    } catch {
      try {
        const fallback: any[] = await prisma.$queryRaw`SELECT ID, Code, Name FROM CostCenters`;
        return fallback.map(cc => ({
          id: cc.ID,
          code: cc.Code ?? '',
          name: cc.Name ?? '',
        }));
      } catch {
        return [];
      }
    }
  }

  public async getCostCentersMain(): Promise<any[]> {
    try {
      const costCenters: any[] = await prisma.$queryRawUnsafe("SELECT * FROM DCC_getCostOPRC");
      return costCenters.map((cc, idx) => ({
        id: idx + 1,
        code: cc.PrcCode ?? cc.Code ?? '',
        name: cc.PrcName ?? cc.Name ?? '',
        dimCode: cc.DimCode ?? null
      }));
    } catch {
      return [];
    }
  }

  public async getAccounts() {
    try {
      const accounts: any[] = await prisma.$queryRawUnsafe("SELECT * FROM DCC_getAccounts");
      return accounts.map(a => ({
        acctCode: a.AcctCode ?? '',
        acctName: a.AcctName ?? '',
      }));
    } catch {
      return [];
    }
  }

  public async getFreightCharges() {
    const charges = await prisma.freightCharges.findMany({
      select: { id: true, freight_name: true, remarks: true },
    });
    return charges.map(c => ({
      id: c.id,
      name: c.freight_name ?? '',
      remarks: c.remarks ?? '',
    }));
  }

  public async getExpenses() {
    const expenses = await prisma.expenses.findMany({
      select: { id: true, expenseType: true, Discription: true },
    });
    return expenses.map(e => ({
      id: e.id,
      type: e.expenseType ?? '',
      description: e.Discription ?? '',
    }));
  }

  public async getActivityTypes() {
    const types = await prisma.activityTypes.findMany({
      select: { ID: true, Name: true },
    });
    return types.map(t => ({
      id: t.ID,
      name: t.Name ?? '',
    }));
  }

  public async getActivityStatuses() {
    const statuses = await prisma.activityStatus.findMany({
      select: { ID: true, Name: true },
    });
    return statuses.map(s => ({
      id: s.ID,
      name: s.Name ?? '',
    }));
  }

  public async getActivitySubjects() {
    const subjects = await prisma.activitySubjects.findMany({
      select: { ID: true, Name: true, ActTypeID: true },
    });
    return subjects.map(s => ({
      id: s.ID,
      name: s.Name ?? '',
      typeId: s.ActTypeID,
    }));
  }
}
