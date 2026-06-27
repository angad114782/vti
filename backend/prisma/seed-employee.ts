import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) { console.log('Company not found — run seed.ts first'); return; }

  const pw = await bcrypt.hash('employee@123', 10);

  // Create employee user
  const user = await prisma.user.upsert({
    where: { email: 'employee@smartfactory.com' },
    update: {},
    create: { email: 'employee@smartfactory.com', password: pw, name: 'Rahul Sharma', role: 'EMPLOYEE', companyId: company.id },
  });

  // Create employee profile
  const emp = await prisma.employee.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      employeeId:     'EMP-101',
      userId:         user.id,
      companyId:      company.id,
      department:     'Engineering',
      designation:    'Software Engineer',
      shiftType:      'General',
      shiftTiming:    '09:00 AM - 06:00 PM',
      joiningDate:    new Date('2023-04-01'),
      accountHolder:  'Rahul Sharma',
      bankName:       'HDFC Bank',
      branchName:     'Andheri East',
      annualCtc:      720000,
      employmentType: 'Permanent',
      status:         'Active',
    },
  });

  // Leave requests
  const leaveData = [
    { leaveType: 'Sick',   startDate: '2026-01-13', endDate: '2026-01-14', days: 2, reason: 'Fever and cold', status: 'Approved' },
    { leaveType: 'Casual', startDate: '2026-02-20', endDate: '2026-02-20', days: 1, reason: 'Personal work',  status: 'Approved' },
    { leaveType: 'Earned', startDate: '2026-03-05', endDate: '2026-03-07', days: 3, reason: 'Family function', status: 'Approved' },
    { leaveType: 'Casual', startDate: '2026-06-15', endDate: '2026-06-15', days: 1, reason: 'Doctor visit',   status: 'Pending'  },
    { leaveType: 'Sick',   startDate: '2026-05-08', endDate: '2026-05-09', days: 2, reason: 'Medical leave',  status: 'Rejected' },
  ];

  for (const l of leaveData) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        companyId:  company.id,
        leaveType:  l.leaveType,
        startDate:  new Date(l.startDate),
        endDate:    new Date(l.endDate),
        days:       l.days,
        reason:     l.reason,
        status:     l.status,
      },
    });
  }

  // Payslips
  const payslipData = [
    { payslipId: 'PS-2026-06', period: 'June 2026',    month: 6,  year: 2026, netPay: 54800, status: 'Processing' },
    { payslipId: 'PS-2026-05', period: 'May 2026',     month: 5,  year: 2026, netPay: 55200, status: 'Paid' },
    { payslipId: 'PS-2026-04', period: 'April 2026',   month: 4,  year: 2026, netPay: 54800, status: 'Paid' },
    { payslipId: 'PS-2026-03', period: 'March 2026',   month: 3,  year: 2026, netPay: 55500, status: 'Paid' },
    { payslipId: 'PS-2026-02', period: 'February 2026',month: 2,  year: 2026, netPay: 54200, status: 'Paid' },
    { payslipId: 'PS-2026-01', period: 'January 2026', month: 1,  year: 2026, netPay: 55000, status: 'Paid' },
  ];

  for (const p of payslipData) {
    await prisma.payslip.upsert({
      where: { payslipId: p.payslipId },
      update: {},
      create: { ...p, employeeId: emp.id, companyId: company.id },
    });
  }

  // Expenses
  const expenseData = [
    { category: 'Travel',   amount: 3500,  description: 'Client visit cab & auto', status: 'Approved' },
    { category: 'Materials',amount: 1200,  description: 'Office stationery',        status: 'Approved' },
    { category: 'Travel',   amount: 2800,  description: 'Airport pickup taxi',      status: 'Pending'  },
    { category: 'Utilities',amount: 900,   description: 'Internet recharge WFH',   status: 'Rejected' },
    { category: 'Others',   amount: 500,   description: 'Team lunch contribution',  status: 'Pending'  },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: { employeeId: emp.id, companyId: company.id, ...e },
    });
  }

  console.log('Employee seed complete — employee@smartfactory.com / employee@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
