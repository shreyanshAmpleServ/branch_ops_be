import { prisma } from '../../config/db.js';

export interface CompanyDetail {
  companyName: string;
  companyAddr: string | null;
  printHeader: string | null;
  phone1: string | null;
  phone2: string | null;
  fax: string | null;
  email: string | null;
  localCur: string | null;
  systemCur: string | null;
  tin: string | null;
  vrn: string | null;
  smtpEmail: string | null;
  smtpPassword: string | null;
  smtpServer: string | null;
  smtpPort: string | null;
  smtpType: string | null;
  headerColor: string | null;
  leftMenuColor: string | null;
  compUrl: string | null;
  compLogo: string | null;
}

export class CompanyService {
  public async getCompanyDetails(): Promise<CompanyDetail | null> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe("SELECT * FROM dbo.CompanyDetails");
      if (rows.length === 0) return null;
      const b = rows[0];
      return {
        companyName: b.CompanyName ?? '',
        companyAddr: b.CompanyAddr ?? '',
        printHeader: b.PrintHeader ?? '',
        phone1: b.Phone1 ?? '',
        phone2: b.Phone2 ?? '',
        fax: b.Fax ?? '',
        email: b.E_Mail ?? '',
        localCur: b.LocalCur ?? '',
        systemCur: b.SystemCur ?? '',
        tin: b.TIN ?? '',
        vrn: b.VRN ?? '',
        smtpEmail: b.SmtpEmail ?? '',
        smtpPassword: b.SmtpPassword ?? '',
        smtpServer: b.SmtpServer ?? '',
        smtpPort: b.SmtpPort ?? '',
        smtpType: b.SmtpType ?? '',
        headerColor: b.HeaderColor ?? '',
        leftMenuColor: b.LeftMenuColor ?? '',
        compUrl: b.compUrl ?? '',
        compLogo: b.compLogo ?? '',
      };
    } catch (e) {
      console.error('Error fetching CompanyDetails:', e);
      return null;
    }
  }

  public async updateCompanyDetails(payload: Partial<CompanyDetail>): Promise<CompanyDetail | null> {
    const current = await this.getCompanyDetails();
    if (!current) return null;

    const companyName = current.companyName; // Cannot update primary key, use it for where clause

    const companyAddr = payload.companyAddr !== undefined ? payload.companyAddr : current.companyAddr;
    const printHeader = payload.printHeader !== undefined ? payload.printHeader : current.printHeader;
    const phone1 = payload.phone1 !== undefined ? payload.phone1 : current.phone1;
    const phone2 = payload.phone2 !== undefined ? payload.phone2 : current.phone2;
    const fax = payload.fax !== undefined ? payload.fax : current.fax;
    const email = payload.email !== undefined ? payload.email : current.email;
    const localCur = payload.localCur !== undefined ? payload.localCur : current.localCur;
    const systemCur = payload.systemCur !== undefined ? payload.systemCur : current.systemCur;
    const tin = payload.tin !== undefined ? payload.tin : current.tin;
    const vrn = payload.vrn !== undefined ? payload.vrn : current.vrn;
    const smtpEmail = payload.smtpEmail !== undefined ? payload.smtpEmail : current.smtpEmail;
    const smtpPassword = payload.smtpPassword !== undefined ? payload.smtpPassword : current.smtpPassword;
    const smtpServer = payload.smtpServer !== undefined ? payload.smtpServer : current.smtpServer;
    const smtpPort = payload.smtpPort !== undefined ? payload.smtpPort : current.smtpPort;
    const smtpType = payload.smtpType !== undefined ? payload.smtpType : current.smtpType;
    const headerColor = payload.headerColor !== undefined ? payload.headerColor : current.headerColor;
    const leftMenuColor = payload.leftMenuColor !== undefined ? payload.leftMenuColor : current.leftMenuColor;
    const compUrl = payload.compUrl !== undefined ? payload.compUrl : current.compUrl;
    const compLogo = payload.compLogo !== undefined ? payload.compLogo : current.compLogo;

    try {
      await prisma.$executeRawUnsafe(`
        UPDATE dbo.CompanyDetails SET 
          CompanyAddr = @P1, PrintHeader = @P2, Phone1 = @P3, Phone2 = @P4, Fax = @P5, 
          E_Mail = @P6, LocalCur = @P7, SystemCur = @P8, TIN = @P9, VRN = @P10, 
          SmtpEmail = @P11, SmtpPassword = @P12, SmtpServer = @P13, SmtpPort = @P14, SmtpType = @P15, 
          HeaderColor = @P16, LeftMenuColor = @P17, compUrl = @P18, compLogo = @P19
        WHERE CompanyName = @P20`,
        companyAddr, printHeader, phone1, phone2, fax, 
        email, localCur, systemCur, tin, vrn, 
        smtpEmail, smtpPassword, smtpServer, smtpPort, smtpType, 
        headerColor, leftMenuColor, compUrl, compLogo, companyName
      );
      return this.getCompanyDetails();
    } catch (e) {
      console.error('Error updating CompanyDetails:', e);
      return null;
    }
  }
}
