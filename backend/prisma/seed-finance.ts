import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EXPENSE_CATS = ['Travel', 'Materials', 'Utilities', 'Maintenance', 'Others'];
const EXPENSE_STATUS = ['Pending', 'Approved', 'Rejected'];

async function main() {
  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) { console.log('No active company. Run seed-hr.ts first.'); return; }

  const pw = await bcrypt.hash('finance@123', 10);

  const finUser = await prisma.user.upsert({
    where: { email: 'finance@smartfactory.com' },
    update: {},
    create: { email: 'finance@smartfactory.com', password: pw, name: 'Ankita Yadav', role: 'FINANCE', companyId: company.id },
  });

  await prisma.employee.upsert({
    where: { userId: finUser.id },
    update: {},
    create: {
      employeeId: 'EMP102',
      userId: finUser.id,
      companyId: company.id,
      department: 'Finance',
      designation: 'Finance Manager',
      shiftType: 'Morning',
      shiftTiming: '09:00-18:00',
      joiningDate: new Date('2021-03-01'),
      employmentType: 'Permanent',
      status: 'Active',
      annualCtc: 1500000,
    },
  });

  // Add expense records for employees
  const employees = await prisma.employee.findMany({
    where: { companyId: company.id },
    include: { user: true },
    take: 10,
  });

  const rng = (n: number) => Math.floor(Math.random() * n);

  for (let i = 0; i < 24; i++) {
    const emp = employees[rng(employees.length)]!;
    await prisma.expense.create({
      data: {
        employeeId: emp.id,
        companyId: company.id,
        category: EXPENSE_CATS[rng(EXPENSE_CATS.length)]!,
        amount: Math.round((1000 + Math.random() * 9000) * 10) / 10,
        description: `${EXPENSE_CATS[rng(EXPENSE_CATS.length)]} expense claim`,
        status: EXPENSE_STATUS[rng(EXPENSE_STATUS.length)]!,
        createdAt: new Date(Date.now() - rng(30) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Finance seeded: finance@smartfactory.com / finance@123');
  console.log('24 expense records created');
}

main().catch(console.error).finally(() => prisma.$disconnect());
