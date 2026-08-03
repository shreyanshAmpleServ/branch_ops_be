import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database configurations...');

  // Initialize SystemConfig
  await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
    },
  });

  // Seed default Users
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@crm.com' },
    update: {},
    create: {
      email: 'manager@crm.com',
      passwordHash,
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'user@crm.com' },
    update: {},
    create: {
      email: 'user@crm.com',
      passwordHash,
      firstName: 'Standard',
      lastName: 'User',
      role: 'user',
    },
  });

  console.log('Users seeded:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Manager: ${manager.email}`);
  console.log(`- Staff: ${staff.email}`);

  // Seed some default Contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 019-2834',
      company: 'Acme Corp',
      position: 'Director of Procurement',
      status: 'active',
      source: 'referral',
      userId: admin.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1 (555) 015-9922',
      company: 'Global Industries',
      position: 'VP of Sales',
      status: 'prospect',
      source: 'website',
      userId: admin.id,
    },
  });

  // Seed some Leads
  await prisma.lead.create({
    data: {
      title: 'Acme Corp - Enterprise License RFP',
      value: 125000.0,
      stage: 'proposal',
      priority: 'high',
      source: 'referral',
      assignedToId: admin.id,
      contactId: contact1.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
    },
  });

  // Seed some Deals
  await prisma.deal.create({
    data: {
      title: 'Global Industries - CRM Integration Deal',
      value: 45000.0,
      stage: 'discovery',
      probability: 30,
      assignedToId: admin.id,
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Tasks
  await prisma.task.create({
    data: {
      title: 'Follow up with Jane Smith on Acme proposal',
      description: 'Discuss discount terms and service level agreements.',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedToId: admin.id,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
