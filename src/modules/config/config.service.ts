import { prisma } from '../../config/db.js';

export class ConfigService {
  public async getConfig() {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'singleton',
          currency: 'USD',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
        },
      });
    }

    return config;
  }

  public async updateConfig(data: any) {
    return prisma.systemConfig.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data,
      },
    });
  }
}
