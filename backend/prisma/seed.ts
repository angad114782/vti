import { PrismaClient, PlanType, CompanyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@workmgmt.com' },
    update: {},
    create: {
      email: 'admin@workmgmt.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.plan.upsert({
    where: { type: PlanType.BASIC },
    update: {},
    create: {
      name: 'Basic',
      type: PlanType.BASIC,
      price: 1999,
      maxUsers: 100,
      features: ['Employee Management', 'Attendance Tracking', 'Basic Analytics', 'Email Support'],
    },
  });

  await prisma.plan.upsert({
    where: { type: PlanType.PRO },
    update: {},
    create: {
      name: 'Pro',
      type: PlanType.PRO,
      price: 3999,
      maxUsers: 500,
      features: ['Employee Management', 'Attendance Tracking', 'Basic Analytics', 'Email Support', 'Payroll Management', 'Advanced Reports'],
    },
  });

  await prisma.plan.upsert({
    where: { type: PlanType.ENTERPRISE },
    update: {},
    create: {
      name: 'Enterprise',
      type: PlanType.ENTERPRISE,
      price: 7999,
      maxUsers: 999999,
      features: ['All Pro Features', 'Unlimited Users', 'Priority Support', 'Custom Integrations', 'Dedicated Account Manager'],
    },
  });

  const modules = [
    { name: 'Employee Management', description: 'Manage employee records and profiles', availableFor: [PlanType.BASIC, PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Attendance Tracking', description: 'Track employee attendance and working hours', availableFor: [PlanType.BASIC, PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Shift Management', description: 'Manage work shifts and schedules', availableFor: [PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Payroll Management', description: 'Process salaries and manage compensation', availableFor: [PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Leave Management', description: 'Handle leave requests and approvals', availableFor: [PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Reports', description: 'Generate attendance and workforce reports', availableFor: [PlanType.PRO, PlanType.ENTERPRISE] },
    { name: 'Expense Tracking', description: 'Track and manage employee expenses', availableFor: [PlanType.ENTERPRISE] },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod.name },
      update: {},
      create: mod,
    });
  }

  // Sample companies
  const companies = [
    { name: 'SmartFactory Co.', industry: 'Manufacturing', status: CompanyStatus.ACTIVE, plan: PlanType.ENTERPRISE },
    { name: 'TechWave Inc.', industry: 'Technology', status: CompanyStatus.TRIAL, plan: PlanType.PRO },
    { name: 'BuildRight Ltd.', industry: 'Construction', status: CompanyStatus.ACTIVE, plan: PlanType.BASIC },
  ];

  for (const co of companies) {
    await prisma.company.upsert({
      where: { id: co.name },
      update: {},
      create: {
        id: co.name,
        name: co.name,
        industry: co.industry,
        status: co.status,
        plan: co.plan,
        planExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => {});
  }

  console.log('Seed completed successfully');
  console.log('Super Admin login: admin@workmgmt.com / admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
