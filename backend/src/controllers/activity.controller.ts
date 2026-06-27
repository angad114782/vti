import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type = 'activity',
      search, company, role, action, module, status,
      page = '1', limit = '10',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};

    if (type === 'login') {
      where.action = 'Logged In';
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (company && company !== 'ALL') where.companyId = company;
    if (role && role !== 'ALL') where.user = { role };
    if (action && action !== 'ALL') where.action = { contains: action, mode: 'insensitive' };
    if (module && module !== 'ALL') where.module = module;
    if (status && status !== 'ALL') where.status = status;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, successLogs, failedLogs] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { createdAt: { gte: today } } }),
      prisma.activityLog.count({ where: { status: 'Success' } }),
      prisma.activityLog.count({ where: { status: 'Failed' } }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      stats: { total: totalLogs, today: todayLogs, success: successLogs, failed: failedLogs },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompaniesFilter = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(companies);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
