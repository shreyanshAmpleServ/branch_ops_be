import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/appError.js';

// ─── Helper: shape a DB user into a clean API response ────────────────────────
function mapUser(user: any) {
  return {
    id: user.id,
    code: user.Code ?? null,
    firstName: user.FirstName,
    middleName: user.MiddleName ?? null,
    lastName: user.LastName ?? null,
    fullName: [user.FirstName, user.MiddleName, user.LastName].filter(Boolean).join(' '),
    email: user.Email ?? null,
    mobileNo: user.MobileNo ?? null,
    gender: user.Gender ?? null,
    dob: user.DOB ?? null,
    address: user.Address ?? null,
    department: user.Department ?? null,
    isAdmin: user.IsAdmin === 'Y',
    active: user.Active === 'Y',
    profileImg: user.ProfileImg ?? null,
    branchId: user.Branch_id ?? null,
    maxDiscount: user.MaxDiscount ?? null,
    isAllowLineDiscount: user.isAllowLineDiscount === 'Y',
    isPriceEdit: user.IsPriceEdit === 'Y',
    role: user.IsAdmin === 'Y' ? 'admin' : 'user',
    createdAt: user.created_at ?? null,
    project: user.project ?? null,
    dfltWhsId: user.DfltWhsID ?? null,
    route: user.Route ?? null,
    isFrieghtAdd: user.IsFrieghtAdd === 'Y',
    dim1: user.DIM1 ?? null,
    dim2: user.DIM2 ?? null,
    dim3: user.DIM3 ?? null,
    dim4: user.DIM4 ?? null,
    cashAcct: user.CashAcct ?? null,
    checkAcct: user.CheckAcct ?? null,
    tigoPesa: user.TigoPesa ?? null,
    mpesa: user.Mpesa ?? null,
    airtelMoney: user.AirtelMoney ?? null,
    bankDeposit: user.BankDeposit ?? null,
    userPermission: user.user_permission ?? null,
  };
}

export class UsersService {
  /** Paginated list of all users with optional search & active filter */
  public async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    active?: string; // 'Y' | 'N' | 'all'
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.active && params.active !== 'all') {
      where.Active = params.active;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { FirstName: { contains: s } },
        { LastName: { contains: s } },
        { Email: { contains: s } },
        { MobileNo: { contains: s } },
        { Code: { contains: s } },
        { Department: { contains: s } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { FirstName: 'asc' },
        select: {
          id: true,
          Code: true,
          FirstName: true,
          MiddleName: true,
          LastName: true,
          Email: true,
          MobileNo: true,
          Gender: true,
          DOB: true,
          Address: true,
          Department: true,
          IsAdmin: true,
          Active: true,
          ProfileImg: true,
          Branch_id: true,
          MaxDiscount: true,
          isAllowLineDiscount: true,
          IsPriceEdit: true,
          IsFrieghtAdd: true,
          project: true,
          DfltWhsID: true,
          Route: true,
          DIM1: true,
          DIM2: true,
          DIM3: true,
          DIM4: true,
          CashAcct: true,
          CheckAcct: true,
          TigoPesa: true,
          Mpesa: true,
          AirtelMoney: true,
          BankDeposit: true,
          user_permission: true,
          created_at: true,
        },
      }),
    ]);

    return {
      users: users.map(mapUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        active: await prisma.users.count({ where: { ...where, Active: 'Y' } }),
        inactive: await prisma.users.count({ where: { ...where, Active: 'N' } }),
        admins: await prisma.users.count({ where: { ...where, IsAdmin: 'Y' } }),
      },
    };
  }

  /** Get a single user by ID */
  public async getUserById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        Code: true,
        FirstName: true,
        MiddleName: true,
        LastName: true,
        Email: true,
        MobileNo: true,
        Gender: true,
        DOB: true,
        Address: true,
        Department: true,
        IsAdmin: true,
        Active: true,
        ProfileImg: true,
        Branch_id: true,
        MaxDiscount: true,
        isAllowLineDiscount: true,
        IsPriceEdit: true,
        IsFrieghtAdd: true,
        project: true,
        DfltWhsID: true,
        Route: true,
        DIM1: true,
        DIM2: true,
        DIM3: true,
        DIM4: true,
        CashAcct: true,
        CheckAcct: true,
        TigoPesa: true,
        Mpesa: true,
        AirtelMoney: true,
        BankDeposit: true,
        user_permission: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return mapUser(user);
  }

  /** Update user profile fields */
  public async updateUser(
    id: number,
    data: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      email?: string;
      mobileNo?: string;
      gender?: string;
      dob?: string;
      address?: string;
      department?: string;
      active?: boolean;
      isAdmin?: boolean;
      branchId?: number | null;
      project?: string | null;
      dfltWhsId?: number | null;
      route?: string | null;
      maxDiscount?: number | null;
      isPriceEdit?: boolean;
      isAllowLineDiscount?: boolean;
      isFrieghtAdd?: boolean;
      dim1?: string | null;
      dim2?: string | null;
      dim3?: string | null;
      dim4?: string | null;
      cashAcct?: string | null;
      checkAcct?: string | null;
      tigoPesa?: string | null;
      mpesa?: string | null;
      airtelMoney?: string | null;
      bankDeposit?: string | null;
      userPermission?: string | null;
    }
  ) {
    // Ensure user exists
    await this.getUserById(id);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.FirstName = data.firstName;
    if (data.middleName !== undefined) updateData.MiddleName = data.middleName;
    if (data.lastName !== undefined) updateData.LastName = data.lastName;
    if (data.email !== undefined) updateData.Email = data.email;
    if (data.mobileNo !== undefined) updateData.MobileNo = data.mobileNo;
    if (data.gender !== undefined) updateData.Gender = data.gender;
    if (data.dob !== undefined) updateData.DOB = data.dob ? new Date(data.dob) : null;
    if (data.address !== undefined) updateData.Address = data.address;
    if (data.department !== undefined) updateData.Department = data.department;
    if (data.active !== undefined) updateData.Active = data.active ? 'Y' : 'N';
    if (data.isAdmin !== undefined) updateData.IsAdmin = data.isAdmin ? 'Y' : 'N';
    if (data.branchId !== undefined) updateData.Branch_id = data.branchId;
    if (data.project !== undefined) updateData.project = data.project;
    if (data.dfltWhsId !== undefined) updateData.DfltWhsID = data.dfltWhsId;
    if (data.route !== undefined) updateData.Route = data.route;
    if (data.maxDiscount !== undefined) updateData.MaxDiscount = data.maxDiscount;
    if (data.isPriceEdit !== undefined) updateData.IsPriceEdit = data.isPriceEdit ? 'Y' : 'N';
    if (data.isAllowLineDiscount !== undefined) updateData.isAllowLineDiscount = data.isAllowLineDiscount ? 'Y' : 'N';
    if (data.isFrieghtAdd !== undefined) updateData.IsFrieghtAdd = data.isFrieghtAdd ? 'Y' : 'N';
    if (data.dim1 !== undefined) updateData.DIM1 = data.dim1;
    if (data.dim2 !== undefined) updateData.DIM2 = data.dim2;
    if (data.dim3 !== undefined) updateData.DIM3 = data.dim3;
    if (data.dim4 !== undefined) updateData.DIM4 = data.dim4;
    if (data.cashAcct !== undefined) updateData.CashAcct = data.cashAcct;
    if (data.checkAcct !== undefined) updateData.CheckAcct = data.checkAcct;
    if (data.tigoPesa !== undefined) updateData.TigoPesa = data.tigoPesa;
    if (data.mpesa !== undefined) updateData.Mpesa = data.mpesa;
    if (data.airtelMoney !== undefined) updateData.AirtelMoney = data.airtelMoney;
    if (data.bankDeposit !== undefined) updateData.BankDeposit = data.bankDeposit;
    if (data.userPermission !== undefined) updateData.user_permission = data.userPermission;

    if (Object.keys(updateData).length === 0) {
      return this.getUserById(id);
    }

    updateData.updated_at = new Date();

    const updated = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        Code: true,
        FirstName: true,
        MiddleName: true,
        LastName: true,
        Email: true,
        MobileNo: true,
        Gender: true,
        DOB: true,
        Address: true,
        Department: true,
        IsAdmin: true,
        Active: true,
        ProfileImg: true,
        Branch_id: true,
        MaxDiscount: true,
        isAllowLineDiscount: true,
        IsPriceEdit: true,
        created_at: true,
      },
    });

    return mapUser(updated);
  }

  /** Update profile image path for a user */
  public async updateProfileImage(id: number, filename: string) {
    await this.getUserById(id);

    const updated = await prisma.users.update({
      where: { id },
      data: { ProfileImg: filename, updated_at: new Date() },
      select: {
        id: true,
        Code: true,
        FirstName: true,
        MiddleName: true,
        LastName: true,
        Email: true,
        MobileNo: true,
        Gender: true,
        DOB: true,
        Address: true,
        Department: true,
        IsAdmin: true,
        Active: true,
        ProfileImg: true,
        Branch_id: true,
        MaxDiscount: true,
        isAllowLineDiscount: true,
        IsPriceEdit: true,
        created_at: true,
      },
    });

    return mapUser(updated);
  }
}
