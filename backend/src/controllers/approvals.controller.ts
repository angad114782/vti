import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getApprovals = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, type, search } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (type && type !== 'ALL') where.type = type;
  if (search) where.employee = { user: { name: { contains: search, mode: 'insensitive' } } };

  const approvals = await prisma.approval.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const pending   = await prisma.approval.count({ where: { companyId, status: 'Pending' } });
  const approved  = await prisma.approval.count({ where: { companyId, status: 'Approved', date: { gte: new Date(new Date().setHours(0,0,0,0)) } } });
  const rejected  = await prisma.approval.count({ where: { companyId, status: 'Rejected' } });
  const escalated = Math.max(0, pending - 20);

  res.json({ approvals, stats: { pending, approvedToday: approved, rejected, escalated } });
};

export const updateApproval = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body as { status: string };
  const approval = await prisma.approval.update({
    where: { id },
    data: { status },
    include: { employee: { include: { user: { select: { name: true } } } } },
  });
  res.json(approval);
};
