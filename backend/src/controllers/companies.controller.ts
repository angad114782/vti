import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { PlanType, CompanyStatus } from '@prisma/client';

export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, status, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan && plan !== 'ALL') where.plan = plan as PlanType;
    if (status && status !== 'ALL') where.status = status as CompanyStatus;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    const [totalCount, activeCount, trialCount, expiringCount] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'ACTIVE' } }),
      prisma.company.count({ where: { status: 'TRIAL' } }),
      prisma.company.count({
        where: {
          planExpiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
        },
      }),
    ]);

    res.json({
      companies: companies.map((c) => ({ ...c, userCount: c._count.users })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      stats: { total: totalCount, active: activeCount, trial: trialCount, expiringSoon: expiringCount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        subscription: true,
        modules: { include: { module: true } },
      },
    });
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }
    res.json(company);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, industry, email, phone, address, plan, status, maxUsers, planExpiry } = req.body as {
      name: string; industry?: string; email?: string; phone?: string; address?: string;
      plan?: PlanType; status?: CompanyStatus; maxUsers?: number; planExpiry?: string;
    };

    if (!name) { res.status(400).json({ message: 'Company name is required' }); return; }

    const company = await prisma.company.create({
      data: {
        name, industry, email, phone, address,
        plan: plan ?? 'BASIC',
        status: status ?? 'TRIAL',
        maxUsers: maxUsers ?? 100,
        planExpiry: planExpiry ? new Date(planExpiry) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json(company);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, industry, email, phone, address, plan, status, maxUsers, planExpiry } = req.body as {
      name?: string; industry?: string; email?: string; phone?: string; address?: string;
      plan?: PlanType; status?: CompanyStatus; maxUsers?: number; planExpiry?: string;
    };

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(industry !== undefined && { industry }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(maxUsers !== undefined && { maxUsers }),
        ...(planExpiry && { planExpiry: new Date(planExpiry) }),
      },
    });
    res.json(company);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
