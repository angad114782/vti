import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const actions = [
  { action: 'Generated payroll report', module: 'Payroll', status: 'Success' },
  { action: 'Logged In', module: 'Auth', status: 'Success' },
  { action: 'Added employee', module: 'Workforce', status: 'Success' },
  { action: 'Updated company plan', module: 'Subscriptions', status: 'Success' },
  { action: 'Approved leave request', module: 'Attendance', status: 'Success' },
  { action: 'Created shift schedule', module: 'Shift Management', status: 'Success' },
  { action: 'Exported attendance report', module: 'Reports', status: 'Success' },
  { action: 'Login failed', module: 'Auth', status: 'Failed' },
  { action: 'Deleted employee record', module: 'Workforce', status: 'Success' },
  { action: 'Updated salary structure', module: 'Payroll', status: 'Success' },
  { action: 'Assigned modules', module: 'Modules', status: 'Success' },
  { action: 'Reset user password', module: 'Settings', status: 'Success' },
];

const ips = ['192.168.1.10', '192.168.1.22', '10.0.0.5', '172.16.0.3', '192.168.0.50'];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const companies = await prisma.company.findMany({ take: 6 });

  if (!admin) { console.log('No admin found'); return; }

  const logs = [];
  for (let i = 0; i < 40; i++) {
    const act = actions[i % actions.length]!;
    const co = companies[i % companies.length];
    const date = new Date(Date.now() - i * 3 * 60 * 60 * 1000);
    logs.push({
      userId: admin.id,
      companyId: co?.id ?? null,
      action: act.action,
      module: act.module,
      status: act.status,
      ipAddress: ips[i % ips.length]!,
      userAgent: 'Mozilla/5.0 Chrome/120',
      createdAt: date,
    });
  }

  await prisma.activityLog.createMany({ data: logs });
  console.log(`Created ${logs.length} activity logs`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
