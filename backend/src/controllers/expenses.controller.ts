import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    const { status, category, search, page = '1', limit = '20' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.employee = { user: { name: { contains: search, mode: 'insensitive' } } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { employee: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where }),
    ]);

    const allForStats = await prisma.expense.findMany({ where: companyId ? { companyId } : {} });
    const pending  = allForStats.filter((e) => e.status === 'Pending').length;
    const approved = allForStats.filter((e) => e.status === 'Approved').length;
    const rejected = allForStats.filter((e) => e.status === 'Rejected').length;

    res.json({ expenses, total, page: parseInt(page), stats: { pending, approved, rejected } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    const expense = await prisma.expense.update({ where: { id }, data: { status } });
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
