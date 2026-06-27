import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) { console.log('No active company found. Run seed-hr.ts first.'); return; }

  const pw = await bcrypt.hash('manager@123', 10);
  const spw = await bcrypt.hash('supervisor@123', 10);

  // Manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@smartfactory.com' },
    update: {},
    create: { email: 'manager@smartfactory.com', password: pw, name: 'Ankita Yadav', role: 'MANAGER', companyId: company.id },
  });

  await prisma.employee.upsert({
    where: { userId: manager.id },
    update: {},
    create: {
      employeeId: 'EMP100',
      userId: manager.id,
      companyId: company.id,
      department: 'Operations',
      designation: 'Operations Manager',
      shiftType: 'Morning',
      shiftTiming: '09:00-18:00',
      joiningDate: new Date('2022-01-15'),
      employmentType: 'Permanent',
      status: 'Active',
      annualCtc: 1800000,
    },
  });

  // Supervisor user
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@smartfactory.com' },
    update: {},
    create: { email: 'supervisor@smartfactory.com', password: spw, name: 'Ankita Yadav', role: 'SUPERVISOR', companyId: company.id },
  });

  await prisma.employee.upsert({
    where: { userId: supervisor.id },
    update: {},
    create: {
      employeeId: 'EMP101',
      userId: supervisor.id,
      companyId: company.id,
      department: 'Assembly',
      designation: 'Line Supervisor',
      shiftType: 'Morning',
      shiftTiming: '08:00-16:00',
      joiningDate: new Date('2022-06-01'),
      employmentType: 'Permanent',
      status: 'Active',
      annualCtc: 960000,
    },
  });

  console.log('Manager seeded: manager@smartfactory.com / manager@123');
  console.log('Supervisor seeded: supervisor@smartfactory.com / supervisor@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
