import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = ['Administrator', 'Accountant', 'Manager', 'Supervisor', 'Contract Workforce'];

const PERMISSIONS = [
  // Attendance Module
  { module: 'ATTENDANCE', permission: 'View team attendance' },
  { module: 'ATTENDANCE', permission: 'Edit attendance records' },
  { module: 'ATTENDANCE', permission: 'Manage shifts' },
  // Workforce Module
  { module: 'WORKFORCE', permission: 'View Employee Profiles' },
  { module: 'WORKFORCE', permission: 'Add/Edit Employees' },
  { module: 'WORKFORCE', permission: 'Manage Documents' },
  // Reports Module
  { module: 'REPORTS', permission: 'Generate attendance report' },
  { module: 'REPORTS', permission: 'View Payroll Summaries' },
  { module: 'REPORTS', permission: 'Export Data' },
  // Payroll Module
  { module: 'PAYROLL', permission: 'Process payroll' },
  { module: 'PAYROLL', permission: 'View salary details' },
  { module: 'PAYROLL', permission: 'Approve expenses' },
];

// Default grants per role
const ROLE_GRANTS: Record<string, string[]> = {
  Administrator: [
    'View team attendance', 'Edit attendance records', 'Manage shifts',
    'View Employee Profiles', 'Add/Edit Employees', 'Manage Documents',
    'Generate attendance report', 'View Payroll Summaries', 'Export Data',
    'Process payroll', 'View salary details', 'Approve expenses',
  ],
  Accountant: [
    'View team attendance',
    'View Employee Profiles',
    'Generate attendance report', 'View Payroll Summaries', 'Export Data',
    'Process payroll', 'View salary details', 'Approve expenses',
  ],
  Manager: [
    'View team attendance', 'Edit attendance records', 'Manage shifts',
    'View Employee Profiles', 'Add/Edit Employees',
    'Generate attendance report', 'View Payroll Summaries',
  ],
  Supervisor: [
    'View team attendance', 'Edit attendance records',
    'View Employee Profiles',
    'Generate attendance report',
  ],
  'Contract Workforce': [
    'View team attendance',
    'View Employee Profiles',
  ],
};

async function main() {
  let created = 0;
  for (const role of ROLES) {
    const grants = ROLE_GRANTS[role] ?? [];
    for (const { module, permission } of PERMISSIONS) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: {},
        create: { role, module, permission, isGranted: grants.includes(permission) },
      });
      created++;
    }
  }
  console.log(`Seeded ${created} role permissions`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
