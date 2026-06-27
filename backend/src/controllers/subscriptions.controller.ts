import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { PlanType } from '@prisma/client';

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, billing, status, page = '1', limit = '8' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const companyWhere: Record<string, unknown> = {};
    if (search) {
      companyWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan && plan !== 'ALL') companyWhere.plan = plan as PlanType;

    const subWhere: Record<string, unknown> = {};
    if (status && status !== 'ALL') subWhere.isActive = status === 'ACTIVE';
    if (billing && billing !== 'ALL') subWhere.billingCycle = billing;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { ...subWhere, company: companyWhere },
        skip,
        take: parseInt(limit),
        include: { company: { select: { id: true, name: true, industry: true, plan: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where: { ...subWhere, company: companyWhere } }),
    ]);

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeCount, trialCount, expiringCount, totalRevenue] = await Promise.all([
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.company.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { endDate: { lte: in30, gte: now }, isActive: true } }),
      prisma.subscription.aggregate({ _sum: { amount: true }, where: { isActive: true } }),
    ]);

    res.json({
      subscriptions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      stats: {
        monthlyRevenue: totalRevenue._sum.amount ?? 0,
        active: activeCount,
        trial: trialCount,
        expiringSoon: expiringCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
    res.json(plans);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, plan, billingCycle, months } = req.body as {
      companyId: string; plan: PlanType; billingCycle: string; months: number;
    };

    if (!companyId || !plan) { res.status(400).json({ message: 'companyId and plan are required' }); return; }

    const planData = await prisma.plan.findUnique({ where: { type: plan } });
    if (!planData) { res.status(404).json({ message: 'Plan not found' }); return; }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (months ?? 1));

    await prisma.subscription.upsert({
      where: { companyId },
      update: { plan, billingCycle: billingCycle ?? 'Monthly', amount: planData.price, endDate, isActive: true },
      create: { companyId, plan, billingCycle: billingCycle ?? 'Monthly', amount: planData.price, endDate },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { plan, status: 'ACTIVE', planExpiry: endDate, maxUsers: planData.maxUsers },
    });

    res.json({ message: 'Plan assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { billingCycle, isActive, endDate } = req.body as { billingCycle?: string; isActive?: boolean; endDate?: string };

    const sub = await prisma.subscription.update({
      where: { id },
      data: {
        ...(billingCycle && { billingCycle }),
        ...(isActive !== undefined && { isActive }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json(sub);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
