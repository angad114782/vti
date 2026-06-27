import { PrismaClient, TicketPriority, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

const tickets = [
  { category: 'Payroll', subject: 'Incorrect salary deduction for employee', priority: 'HIGH' as TicketPriority, status: 'PENDING' as TicketStatus },
  { category: 'Payroll', subject: 'Incorrect salary deduction for employee', priority: 'HIGH' as TicketPriority, status: 'IN_PROGRESS' as TicketStatus },
  { category: 'Attendance Issue', subject: 'Unable to mark attendance for remote workers', priority: 'MEDIUM' as TicketPriority, status: 'PENDING' as TicketStatus },
  { category: 'Employee Management', subject: 'Employee profile data not syncing', priority: 'LOW' as TicketPriority, status: 'RESOLVED' as TicketStatus },
  { category: 'Access & Permissions', subject: 'Manager unable to access reports module', priority: 'HIGH' as TicketPriority, status: 'PENDING' as TicketStatus },
  { category: 'Leave Management', subject: 'Leave balance not updating after approval', priority: 'MEDIUM' as TicketPriority, status: 'IN_PROGRESS' as TicketStatus },
  { category: 'Technical Issue', subject: 'Dashboard not loading on mobile devices', priority: 'CRITICAL' as TicketPriority, status: 'PENDING' as TicketStatus },
  { category: 'Documents & Policies', subject: 'Policy document upload failing', priority: 'LOW' as TicketPriority, status: 'RESOLVED' as TicketStatus },
  { category: 'Payroll', subject: 'Bonus calculation incorrect for Q4', priority: 'HIGH' as TicketPriority, status: 'PENDING' as TicketStatus },
  { category: 'Attendance Issue', subject: 'Shift schedule not reflecting in attendance', priority: 'MEDIUM' as TicketPriority, status: 'RESOLVED' as TicketStatus },
  { category: 'Employee Management', subject: 'Bulk import failing for 500+ employees', priority: 'CRITICAL' as TicketPriority, status: 'IN_PROGRESS' as TicketStatus },
  { category: 'Technical Issue', subject: 'Email notifications not being sent', priority: 'HIGH' as TicketPriority, status: 'PENDING' as TicketStatus },
];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const companies = await prisma.company.findMany({ take: 5 });

  if (!admin) { console.log('No admin found'); return; }

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i]!;
    const co = companies[i % companies.length];
    const date = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000);
    const ticketNo = `#TKT${String(1000 + i).padStart(4, '0')}`;

    await prisma.supportTicket.upsert({
      where: { ticketNo },
      update: {},
      create: {
        ticketNo,
        userId: admin.id,
        companyId: co?.id ?? null,
        category: t.category,
        subject: t.subject,
        description: `Detailed description for: ${t.subject}. This requires immediate attention from the support team.`,
        priority: t.priority,
        status: t.status,
        createdAt: date,
      },
    });
  }

  console.log(`Seeded ${tickets.length} support tickets`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
