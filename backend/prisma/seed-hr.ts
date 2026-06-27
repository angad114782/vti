import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Design', 'Finance'];
const DESIGNATIONS = ['Senior Engineer', 'Sales Executive', 'Marketing Lead', 'HR Specialist', 'UI/UX Designer', 'Financial Analyst', 'Junior Developer', 'Marketing Manager', 'Line Supervisor'];
const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Emergency Leave'];
const APPROVAL_TYPES = ['Leave', 'Expense', 'Attendance Corrections', 'Overtime', 'Shift Change Request'];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const DOC_CATEGORIES = ['Safety', 'HR Policy', 'Compliance', 'Finance', 'IT Policy'];

async function main() {
  // Get first company (SmartFactory Co.)
  let company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'SmartFactory Co.', industry: 'Manufacturing', status: 'ACTIVE', plan: 'ENTERPRISE', planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    });
  }

  const pw = await bcrypt.hash('hr@123', 10);

  // HR user
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@smartfactory.com' },
    update: {},
    create: { email: 'hr@smartfactory.com', password: pw, name: 'Ankita Yadav', role: 'HR', companyId: company.id },
  });

  // 12 employee users + employee profiles
  const empData = [
    { name: 'Alex Turner',    dept: 'Engineering', desig: 'Senior Engineer',      ctc: 1200000, type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Sarah Johnson',  dept: 'Design',       desig: 'UI/UX Designer',       ctc: 950000,  type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Michael Chen',   dept: 'Engineering',  desig: 'Junior Developer',      ctc: 720000,  type: 'Permanent', shift: 'Evening', timing: '14:00-22:00' },
    { name: 'Emma Wilson',    dept: 'HR',           desig: 'HR Specialist',         ctc: 680000,  type: 'Permanent', shift: 'Morning', timing: '09:00-17:00' },
    { name: 'David Kim',      dept: 'Sales',        desig: 'Sales Executive',       ctc: 840000,  type: 'Permanent', shift: 'Morning', timing: '10:00-19:00' },
    { name: 'Priya Sharma',   dept: 'Finance',      desig: 'Financial Analyst',     ctc: 900000,  type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Raj Patel',      dept: 'Marketing',    desig: 'Marketing Manager',     ctc: 1100000, type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Lisa Wang',      dept: 'Engineering',  desig: 'Senior Engineer',       ctc: 1300000, type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Carlos Mendez',  dept: 'Sales',        desig: 'Sales Executive',       ctc: 760000,  type: 'Contract',  shift: 'Morning', timing: '10:00-19:00' },
    { name: 'Aisha Patel',    dept: 'Design',       desig: 'UI/UX Designer',        ctc: 880000,  type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
    { name: 'Tom Bradley',    dept: 'Finance',      desig: 'Financial Analyst',     ctc: 820000,  type: 'Contract',  shift: 'Morning', timing: '09:00-17:00' },
    { name: 'Nina Russo',     dept: 'Marketing',    desig: 'Marketing Lead',        ctc: 970000,  type: 'Permanent', shift: 'Morning', timing: '09:00-18:00' },
  ];

  const employees: { id: string }[] = [];
  for (let i = 0; i < empData.length; i++) {
    const e = empData[i]!;
    const empNo = String(i + 1).padStart(3, '0');
    const email = `${e.name.split(' ')[0]!.toLowerCase()}@smartfactory.com`;

    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pw, name: e.name, role: 'EMPLOYEE', companyId: company.id },
    });

    const emp = await prisma.employee.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        employeeId: `EMP${empNo}`,
        userId: u.id,
        companyId: company.id,
        department: e.dept,
        designation: e.desig,
        shiftType: e.shift,
        shiftTiming: e.timing,
        joiningDate: new Date(2023, i % 12, (i * 3 + 1) % 28 + 1),
        annualCtc: e.ctc,
        employmentType: e.type,
        bankName: 'HDFC Bank',
        branchName: 'Main Branch',
        accountHolder: e.name,
        status: 'Active',
      },
    });
    employees.push({ id: emp.id });

    // Salary structure
    await prisma.salaryStructure.upsert({
      where: { id: `sal_${emp.id}` },
      update: {},
      create: {
        id: `sal_${emp.id}`,
        employeeId: emp.id,
        companyId: company.id,
        role: e.desig,
        employmentType: e.type,
        annualCtc: e.ctc,
        lastRevised: new Date(2025, 0, 15),
      },
    });

    // Payslips (last 3 months)
    for (let m = 0; m < 3; m++) {
      const d = new Date(2026, 1 - m, 1);
      const pid = `PR-FEB-${empNo}-${m}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      await prisma.payslip.upsert({
        where: { payslipId: pid },
        update: {},
        create: {
          payslipId: pid,
          employeeId: emp.id,
          companyId: company.id,
          period: `${months[d.getMonth()]} ${d.getFullYear()}`,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          netPay: Math.round(e.ctc / 12 * 0.78),
          status: m === 0 ? 'Processing' : 'Paid',
        },
      });
    }
  }

  // Leave Requests
  const leaveStatuses = ['Pending', 'Approved', 'Rejected'];
  for (let i = 0; i < 20; i++) {
    const emp = employees[i % employees.length]!;
    const start = new Date(2026, 1, (i % 28) + 1);
    const end = new Date(2026, 1, (i % 28) + (i % 3) + 1);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        companyId: company.id,
        leaveType: LEAVE_TYPES[i % LEAVE_TYPES.length]!,
        startDate: start,
        endDate: end,
        days,
        reason: 'Personal reasons',
        status: leaveStatuses[i % 3]!,
        createdAt: new Date(Date.now() - i * 2 * 86400000),
      },
    });
  }

  // Approvals
  for (let i = 0; i < 24; i++) {
    const emp = employees[i % employees.length]!;
    await prisma.approval.create({
      data: {
        employeeId: emp.id,
        companyId: company.id,
        type: APPROVAL_TYPES[i % APPROVAL_TYPES.length]!,
        details: `${LEAVE_TYPES[i % LEAVE_TYPES.length]} - ${(i % 3) + 1} days`,
        date: new Date(2026, 2, 10),
        priority: PRIORITIES[i % 4]!,
        status: i < 18 ? 'Pending' : i < 22 ? 'Approved' : 'Rejected',
        createdAt: new Date(Date.now() - i * 86400000),
      },
    });
  }

  // Documents
  const docs = [
    { name: 'Safety Guidelines 2026',       category: 'Safety',    version: 'v1.2', size: '2.4 MB' },
    { name: 'Employee Code of Conduct',      category: 'HR Policy', version: 'v2.0', size: '1.1 MB' },
    { name: 'Data Privacy Policy',           category: 'Compliance',version: 'v3.1', size: '890 KB' },
    { name: 'IT Security Policy',            category: 'IT Policy', version: 'v1.5', size: '1.8 MB' },
    { name: 'Leave & Attendance Policy',     category: 'HR Policy', version: 'v1.0', size: '560 KB' },
    { name: 'Financial Reimbursement Guide', category: 'Finance',   version: 'v1.3', size: '2.0 MB' },
  ];

  for (const doc of docs) {
    await prisma.document.create({
      data: {
        name: doc.name,
        category: doc.category,
        uploadedBy: 'HR Admin',
        companyId: company.id,
        fileSize: doc.size,
        version: doc.version,
        visibility: 'All Employees',
      },
    });
  }

  console.log(`HR seed complete: 1 HR user, ${empData.length} employees, 20 leaves, 24 approvals, 6 documents`);
  console.log('HR Login: hr@smartfactory.com / hr@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
