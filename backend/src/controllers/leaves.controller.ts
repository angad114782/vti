import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getLeaves = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, leaveType, search } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;
  if (search) {
    where.employee = { user: { name: { contains: search, mode: 'insensitive' } } };
  }

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pending  = await prisma.leaveRequest.count({ where: { companyId, status: 'Pending' } });
  const approved = await prisma.leaveRequest.count({ where: { companyId, status: 'Approved' } });
  const rejected = await prisma.leaveRequest.count({ where: { companyId, status: 'Rejected' } });

  res.json({ leaves, stats: { total: leaves.length, pending, approved, rejected } });
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body as { status: string };
  const leave = await prisma.leaveRequest.update({ where: { id }, data: { status }, include: { employee: { include: { user: { select: { name: true } } } } } });
  res.json(leave);
};
