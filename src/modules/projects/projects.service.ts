import { prisma } from '../../config/db.js';

export interface ProjectEntity {
  id: number;
  code: string;
  name: string;
  description?: string;
  clientCode?: string;
  clientName?: string;
  manager?: string;
  managerEmail?: string;
  branchId?: number;
  branchName?: string;
  status: 'Not Started' | 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  stage: 'Planning' | 'Procurement' | 'Execution' | 'Inspection' | 'Handover';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  budget: number;
  actualSpend: number;
  committedSpend: number;
  invoicedSpend: number;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
  createdDate: string;
}

// In-memory / extended project state store to enrich legacy SQL Server project records with full management metadata
let dynamicProjectsStore: Map<number, Partial<ProjectEntity>> = new Map([
  [
    1,
    {
      id: 1,
      code: 'PRJ-2026-001',
      name: 'Riyadh Retail Fuel Hub Expansion',
      description: 'Expansion of storage capacity, new POS terminals and automated nozzle monitoring systems.',
      manager: 'Ahmed Al-Mansoor',
      branchId: 1,
      branchName: 'Dcc_branch',
      status: 'In Progress',
      stage: 'Execution',
      priority: 'High',
      budget: 450000,
      actualSpend: 285400,
      committedSpend: 360000,
      invoicedSpend: 245000,
      progressPercent: 65,
      startDate: '2026-01-10',
      endDate: '2026-08-30',
      createdDate: '2026-01-05',
    },
  ],
  [
    2,
    {
      id: 2,
      code: 'PRJ-2026-002',
      name: 'Jeddah Warehouse Logistics Automation',
      description: 'Automated warehouse racking and conveyor belt system installation with ERP sync.',
      manager: 'Sara Al-Ghamdi',
      branchId: 2,
      branchName: 'HQ',
      status: 'In Progress',
      stage: 'Procurement',
      priority: 'Medium',
      budget: 320000,
      actualSpend: 145000,
      committedSpend: 210000,
      invoicedSpend: 110000,
      progressPercent: 42,
      startDate: '2026-02-15',
      endDate: '2026-11-20',
      createdDate: '2026-02-01',
    },
  ],
  [
    3,
    {
      id: 3,
      code: 'PRJ-2026-003',
      name: 'Eastern Province Pipeline Retrofitting',
      description: 'High-precision sensor calibration and pipeline safety valve replacements.',
      manager: 'Tariq Al-Otaibi',
      branchId: 1,
      branchName: 'Dcc_branch',
      status: 'Planning',
      stage: 'Planning',
      priority: 'Critical',
      budget: 680000,
      actualSpend: 42000,
      committedSpend: 120000,
      invoicedSpend: 35000,
      progressPercent: 18,
      startDate: '2026-03-01',
      endDate: '2026-12-15',
      createdDate: '2026-02-20',
    },
  ],
  [
    4,
    {
      id: 4,
      code: 'PRJ-2026-004',
      name: 'Smart Metering & IoT Sensor Fleet',
      description: 'Deploying telemetry and digital meters across all regional dispensing stations.',
      manager: 'Khalid Al-Zahrani',
      branchId: 2,
      branchName: 'HQ',
      status: 'Completed',
      stage: 'Handover',
      priority: 'Low',
      budget: 185000,
      actualSpend: 178900,
      committedSpend: 178900,
      invoicedSpend: 178900,
      progressPercent: 100,
      startDate: '2025-08-01',
      endDate: '2026-02-28',
      createdDate: '2025-07-25',
    },
  ],
]);

export class ProjectsService {
  /** Fetch projects from DB or fallback and merge with project store */
  private async loadRawProjects(): Promise<ProjectEntity[]> {
    let dbProjects: any[] = [];
    try {
      dbProjects = await prisma.$queryRawUnsafe("SELECT * FROM getProjectData");
    } catch {
      try {
        dbProjects = await prisma.$queryRaw`SELECT ID, Code, Name FROM Projects`;
      } catch {
        dbProjects = [];
      }
    }

    // Merge DB records
    dbProjects.forEach((p, idx) => {
      const id = p.ID || idx + 1;
      const code = p.Code || `PRJ-${String(id).padStart(3, '0')}`;
      const name = p.Name || `Project ${code}`;

      if (!dynamicProjectsStore.has(id)) {
        dynamicProjectsStore.set(id, {
          id,
          code,
          name,
          description: `Enterprise infrastructure and procurement project ${name}`,
          manager: 'Project Management Office',
          branchId: 1,
          branchName: 'Dcc_branch',
          status: 'In Progress',
          stage: 'Execution',
          priority: 'Medium',
          budget: 250000,
          actualSpend: 75000,
          committedSpend: 110000,
          invoicedSpend: 60000,
          progressPercent: 30,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdDate: '2026-01-01',
        });
      }
    });

    return Array.from(dynamicProjectsStore.values()) as ProjectEntity[];
  }

  /** Calculate actual procurement spend linked to projects */
  private async enrichSpendFromProcurement(projects: ProjectEntity[]): Promise<ProjectEntity[]> {
    try {
      // Gather PO and AP Invoice items if possible to calculate real financial commitments
      const poItems = await prisma.purchase_order_items.findMany({
        select: { project: true, LineTotalLC: true, OpenQty: true, Quantity: true, UnitPrice: true },
      });

      const poSpendByProject = new Map<string, number>();
      poItems.forEach(item => {
        if (item.project) {
          const key = String(item.project).trim().toLowerCase();
          const lineTotal = Number(item.LineTotalLC ?? (Number(item.Quantity ?? 0) * Number(item.UnitPrice ?? 0)));
          poSpendByProject.set(key, (poSpendByProject.get(key) ?? 0) + lineTotal);
        }
      });

      return projects.map(p => {
        const poExtra = (poSpendByProject.get(p.code.toLowerCase()) ?? 0) + (poSpendByProject.get(p.name.toLowerCase()) ?? 0);
        return {
          ...p,
          committedSpend: p.committedSpend + poExtra,
        };
      });
    } catch {
      return projects;
    }
  }

  /** GET /api/projects with search, pagination, and filter */
  public async getProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    stage?: string;
    branchId?: number;
  }) {
    const raw = await this.loadRawProjects();
    const enriched = await this.enrichSpendFromProcurement(raw);

    let filtered = enriched;

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.clientName && p.clientName.toLowerCase().includes(q)) ||
          (p.clientCode && p.clientCode.toLowerCase().includes(q)) ||
          (p.manager && p.manager.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status.toLowerCase() === params.status?.toLowerCase());
    }

    if (params.stage && params.stage !== 'ALL') {
      filtered = filtered.filter(p => p.stage.toLowerCase() === params.stage?.toLowerCase());
    }

    if (params.branchId) {
      filtered = filtered.filter(p => p.branchId === params.branchId);
    }

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const paginated = filtered.slice(skip, skip + limit);

    // Global stats across all projects
    const total = enriched.length;
    const activeCount = enriched.filter(p => p.status === 'In Progress').length;
    const completedCount = enriched.filter(p => p.status === 'Completed').length;
    const onHoldCount = enriched.filter(p => p.status === 'On Hold').length;
    const totalBudget = enriched.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalActualSpend = enriched.reduce((sum, p) => sum + (Number(p.actualSpend) || 0), 0);
    const totalCommittedSpend = enriched.reduce((sum, p) => sum + (Number(p.committedSpend) || 0), 0);
    const avgProgress = total > 0 ? Math.round(enriched.reduce((sum, p) => sum + (Number(p.progressPercent) || 0), 0) / total) : 0;

    return {
      projects: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
      stats: {
        total,
        active: activeCount,
        completed: completedCount,
        onHold: onHoldCount,
        totalBudget,
        totalActualSpend,
        totalCommittedSpend,
        avgProgress,
      },
    };
  }

  /** GET /api/projects/:id */
  public async getProjectById(id: number) {
    const raw = await this.loadRawProjects();
    const project = raw.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    return project;
  }

  /** POST /api/projects */
  public async createProject(data: {
    code?: string;
    name: string;
    description?: string;
    clientCode?: string;
    clientName?: string;
    manager?: string;
    managerEmail?: string;
    branchId?: number;
    branchName?: string;
    status?: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
    stage?: 'Planning' | 'Procurement' | 'Execution' | 'Inspection' | 'Handover';
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    budget?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const nextId = Math.max(...Array.from(dynamicProjectsStore.keys()), 0) + 1;
    const code = data.code?.trim() || `PRJ-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;

    const newProject: ProjectEntity = {
      id: nextId,
      code,
      name: data.name,
      description: data.description || '',
      clientCode: data.clientCode || '',
      clientName: data.clientName || '',
      manager: data.manager || 'Project Manager',
      managerEmail: data.managerEmail || '',
      branchId: data.branchId || 1,
      branchName: data.branchName || 'Dcc_branch',
      status: data.status || 'In Progress',
      stage: data.stage || 'Planning',
      priority: data.priority || 'Medium',
      budget: Number(data.budget) || 0,
      actualSpend: 0,
      committedSpend: 0,
      invoicedSpend: 0,
      progressPercent: 0,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || '',
      createdDate: new Date().toISOString().split('T')[0],
    };

    dynamicProjectsStore.set(nextId, newProject);

    return newProject;
  }

  /** PUT /api/projects/:id */
  public async updateProject(id: number, data: Partial<ProjectEntity>) {
    const existing = dynamicProjectsStore.get(id);
    if (!existing) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const updated: ProjectEntity = {
      ...(existing as ProjectEntity),
      ...data,
      id,
      budget: data.budget !== undefined ? Number(data.budget) : existing.budget ?? 0,
      actualSpend: data.actualSpend !== undefined ? Number(data.actualSpend) : existing.actualSpend ?? 0,
      progressPercent: data.progressPercent !== undefined ? Number(data.progressPercent) : existing.progressPercent ?? 0,
    };

    dynamicProjectsStore.set(id, updated);
    return updated;
  }

  /** DELETE /api/projects/:id */
  public async deleteProject(id: number) {
    if (!dynamicProjectsStore.has(id)) {
      throw new Error(`Project with ID ${id} not found`);
    }
    dynamicProjectsStore.delete(id);
    return { success: true, id };
  }

  /** GET /api/projects/analytics (Executive Analytics) */
  public async getAnalytics() {
    const projects = await this.loadRawProjects();

    const stageBreakdown = {
      Planning: projects.filter(p => p.stage === 'Planning').length,
      Procurement: projects.filter(p => p.stage === 'Procurement').length,
      Execution: projects.filter(p => p.stage === 'Execution').length,
      Inspection: projects.filter(p => p.stage === 'Inspection').length,
      Handover: projects.filter(p => p.stage === 'Handover').length,
    };

    const statusBreakdown = {
      notStarted: projects.filter(p => p.status === 'Not Started').length,
      inProgress: projects.filter(p => p.status === 'In Progress').length,
      onHold: projects.filter(p => p.status === 'On Hold').length,
      completed: projects.filter(p => p.status === 'Completed').length,
    };

    const priorityBreakdown = {
      Low: projects.filter(p => p.priority === 'Low').length,
      Medium: projects.filter(p => p.priority === 'Medium').length,
      High: projects.filter(p => p.priority === 'High').length,
      Critical: projects.filter(p => p.priority === 'Critical').length,
    };

    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalSpend = projects.reduce((s, p) => s + p.actualSpend, 0);
    const totalCommitted = projects.reduce((s, p) => s + p.committedSpend, 0);
    const burnRatePercent = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0;

    const topProjectsByCost = [...projects]
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        budget: p.budget,
        actualSpend: p.actualSpend,
        progressPercent: p.progressPercent,
        status: p.status,
      }));

    return {
      summary: {
        totalProjects: projects.length,
        totalBudget,
        totalSpend,
        totalCommitted,
        burnRatePercent,
        avgCompletion: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progressPercent, 0) / projects.length) : 0,
      },
      stageBreakdown,
      statusBreakdown,
      priorityBreakdown,
      topProjectsByCost,
    };
  }

  /** GET /api/projects/finance (Stage Financial Progress) */
  public async getFinance() {
    const projects = await this.loadRawProjects();

    const stageFinancials = [
      {
        stage: 'Planning',
        allocatedBudget: projects.filter(p => p.stage === 'Planning').reduce((s, p) => s + p.budget, 0),
        committed: projects.filter(p => p.stage === 'Planning').reduce((s, p) => s + p.committedSpend, 0),
        incurred: projects.filter(p => p.stage === 'Planning').reduce((s, p) => s + p.actualSpend, 0),
        invoiced: projects.filter(p => p.stage === 'Planning').reduce((s, p) => s + p.invoicedSpend, 0),
        projectCount: projects.filter(p => p.stage === 'Planning').length,
      },
      {
        stage: 'Procurement',
        allocatedBudget: projects.filter(p => p.stage === 'Procurement').reduce((s, p) => s + p.budget, 0),
        committed: projects.filter(p => p.stage === 'Procurement').reduce((s, p) => s + p.committedSpend, 0),
        incurred: projects.filter(p => p.stage === 'Procurement').reduce((s, p) => s + p.actualSpend, 0),
        invoiced: projects.filter(p => p.stage === 'Procurement').reduce((s, p) => s + p.invoicedSpend, 0),
        projectCount: projects.filter(p => p.stage === 'Procurement').length,
      },
      {
        stage: 'Execution',
        allocatedBudget: projects.filter(p => p.stage === 'Execution').reduce((s, p) => s + p.budget, 0),
        committed: projects.filter(p => p.stage === 'Execution').reduce((s, p) => s + p.committedSpend, 0),
        incurred: projects.filter(p => p.stage === 'Execution').reduce((s, p) => s + p.actualSpend, 0),
        invoiced: projects.filter(p => p.stage === 'Execution').reduce((s, p) => s + p.invoicedSpend, 0),
        projectCount: projects.filter(p => p.stage === 'Execution').length,
      },
      {
        stage: 'Inspection',
        allocatedBudget: projects.filter(p => p.stage === 'Inspection').reduce((s, p) => s + p.budget, 0),
        committed: projects.filter(p => p.stage === 'Inspection').reduce((s, p) => s + p.committedSpend, 0),
        incurred: projects.filter(p => p.stage === 'Inspection').reduce((s, p) => s + p.actualSpend, 0),
        invoiced: projects.filter(p => p.stage === 'Inspection').reduce((s, p) => s + p.invoicedSpend, 0),
        projectCount: projects.filter(p => p.stage === 'Inspection').length,
      },
      {
        stage: 'Handover',
        allocatedBudget: projects.filter(p => p.stage === 'Handover').reduce((s, p) => s + p.budget, 0),
        committed: projects.filter(p => p.stage === 'Handover').reduce((s, p) => s + p.committedSpend, 0),
        incurred: projects.filter(p => p.stage === 'Handover').reduce((s, p) => s + p.actualSpend, 0),
        invoiced: projects.filter(p => p.stage === 'Handover').reduce((s, p) => s + p.invoicedSpend, 0),
        projectCount: projects.filter(p => p.stage === 'Handover').length,
      },
    ];

    const projectFinancialRows = projects.map(p => {
      const variance = p.budget - p.actualSpend;
      const utilization = p.budget > 0 ? Math.round((p.actualSpend / p.budget) * 100) : 0;
      let health: 'Healthy' | 'Warning' | 'Over Budget' = 'Healthy';
      if (utilization > 100) health = 'Over Budget';
      else if (utilization > 85) health = 'Warning';

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        stage: p.stage,
        manager: p.manager,
        budget: p.budget,
        committedSpend: p.committedSpend,
        actualSpend: p.actualSpend,
        invoicedSpend: p.invoicedSpend,
        variance,
        utilization,
        health,
        progressPercent: p.progressPercent,
      };
    });

    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalActualSpend = projects.reduce((s, p) => s + p.actualSpend, 0);
    const totalCommitted = projects.reduce((s, p) => s + p.committedSpend, 0);
    const totalInvoiced = projects.reduce((s, p) => s + p.invoicedSpend, 0);
    const totalVariance = totalBudget - totalActualSpend;

    return {
      summary: {
        totalBudget,
        totalCommitted,
        totalActualSpend,
        totalInvoiced,
        totalVariance,
        overallUtilization: totalBudget > 0 ? Math.round((totalActualSpend / totalBudget) * 100) : 0,
      },
      stageFinancials,
      projectFinancialRows,
    };
  }
}
