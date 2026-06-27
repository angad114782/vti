import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getAttendanceOverview = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);

  const total = await prisma.employee.count({ where: { companyId } });
  const perm  = await prisma.employee.count({ where: { companyId, employmentType: 'Permanent' } });
  const cont  = total - perm;

  // Simulated attendance (realistic percentages)
  const presentPct = 0.761;
  const absentPct  = 0.033;
  const latePct    = 0.027;

  const present     = Math.round(total * presentPct);
  const absent      = Math.round(total * absentPct);
  const lateArrivals= Math.round(total * latePct);

  const departments = await prisma.employee.groupBy({
    by: ['department'],
    where: { companyId: companyId ?? undefined },
    _count: { id: true },
  });

  const deptAttendance = departments
    .filter((d) => d.department)
    .map((d) => {
      const total = d._count.id;
      const pct   = 0.91 + Math.random() * 0.06;
      const present = Math.round(total * pct);
      return { department: d.department!, total, present, percentage: Math.round(pct * 1000) / 10 };
    })
    .sort((a, b) => b.total - a.total);

  res.json({
    stats: {
      totalWorkforce: total, perm, cont,
      presentToday: present, presentPct: Math.round(presentPct * 1000) / 10,
      absent, absentPct: Math.round(absentPct * 1000) / 10,
      lateArrivals, avgDelay: 12,
    },
    departments: deptAttendance,
  });
};
