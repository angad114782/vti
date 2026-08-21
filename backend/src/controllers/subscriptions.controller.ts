import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import Company from '../models/Company';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import { escapeRegex, clampLimit } from '../utils/query';
import { logActivity } from '../utils/activity';

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, billing, status, page = '1' } = req.query as Record<string, string>;
    const limit = clampLimit(req.query.limit as string | undefined, 8);
    const skip = (parseInt(page) - 1) * limit;

    const subWhere: Record<string, unknown> = {};
    if (status && status !== 'ALL') subWhere.isActive = status === 'ACTIVE';
    if (billing && billing !== 'ALL') subWhere.billingCycle = billing;
    if (plan && plan !== 'ALL') subWhere.plan = plan;

    let companyIds: string[] | null = null;
    if (search) {
      const re = escapeRegex(search);
      const companies = await Company.find({
        isDeleted: { $ne: true },
        $or: [{ name: re }, { nameSearch: re }, { companyCode: re }, { industry: re }, { industrySearch: re }, { email: re }, { emailSearch: re }],
      }).select('_id').lean();
      companyIds = companies.map((c) => c._id.toString());
      subWhere.companyId = { $in: companyIds };
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(subWhere)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('companyId', '_id name companyCode industry plan isDeleted')
        .populate('planId', 'name type price maxUsers features'),
      Subscription.countDocuments(subWhere),
    ]);

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeCount, trialCount, expiringCount, revenueAgg] = await Promise.all([
      Subscription.countDocuments({ isActive: true }),
      Company.countDocuments({ status: 'TRIAL' }),
      Subscription.countDocuments({ endDate: { $lte: in30, $gte: now }, isActive: true }),
      Subscription.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const transformed = subscriptions.map((s: any) => {
      const obj = s.toJSON();
      obj.company = obj.companyId;
      return obj;
    });
    const filtered = transformed.filter((s: any) => s.company != null && !s.company.isDeleted);

    res.json({
      subscriptions: filtered,
      pagination: { total, page: parseInt(page), limit, totalPages: Math.ceil(total / limit) },
      stats: {
        monthlyRevenue: revenueAgg[0]?.total ?? 0,
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
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, price, maxUsers, features } = req.body as {
      name: string; type: string; price: number; maxUsers: number; features: string[];
    };
    if (!name || !type || price == null || maxUsers == null) {
      res.status(400).json({ message: 'name, type, price, and maxUsers are required' });
      return;
    }
    const existing = await Plan.findOne({ type: type.toUpperCase() });
    if (existing) {
      res.status(409).json({ message: `A plan with type "${type.toUpperCase()}" already exists` });
      return;
    }
    const plan = await Plan.create({ name, type: type.toUpperCase(), price, maxUsers, features: features ?? [] });
    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, price, maxUsers, features, isActive } = req.body as {
      name?: string; price?: number; maxUsers?: number; features?: string[]; isActive?: boolean;
    };
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (price !== undefined) update.price = price;
    if (maxUsers !== undefined) update.maxUsers = maxUsers;
    if (features !== undefined) update.features = features;
    if (isActive !== undefined) update.isActive = isActive;
    const plan = await Plan.findByIdAndUpdate(id, update, { returnDocument: 'after' });
    if (!plan) { res.status(404).json({ message: 'Plan not found' }); return; }
    await logActivity(req, `Updated plan "${(plan as any).name}"`, 'Subscriptions');
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, plan, billingCycle, months } = req.body as {
      companyId: string; plan: string; billingCycle: string; months: number;
    };

    if (!companyId || !plan) { res.status(400).json({ message: 'companyId and plan are required' }); return; }

    const planData = await Plan.findOne({ type: plan as any });
    if (!planData) { res.status(404).json({ message: 'Plan not found' }); return; }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (months ?? 1));

    await Subscription.findOneAndUpdate(
      { companyId },
      {
        $set: { planId: planData._id, plan, billingCycle: billingCycle ?? 'Monthly', amount: planData.get('price'), endDate, isActive: true },
        $setOnInsert: { companyId, startDate: new Date() },
      },
      { upsert: true, returnDocument: "after" },
    );

    const co = await Company.findByIdAndUpdate(companyId, {
      plan,
      status: 'ACTIVE',
      planExpiry: endDate,
      maxUsers: planData.get('maxUsers'),
    }, { returnDocument: 'after' });

    // Auto-provision modules for this plan (upsert only — never overwrites existing isEnabled)
    const availableModules = await Module.find({ availableFor: plan }).lean();
    if (availableModules.length) {
      await CompanyModule.bulkWrite(
        availableModules.map((m: any) => ({
          updateOne: {
            filter: { companyId, moduleId: m._id },
            update: { $setOnInsert: { companyId, moduleId: m._id, isEnabled: true } },
            upsert: true,
          },
        })) as any
      );
    }

    await logActivity(req, `Assigned ${plan} plan to "${(co as any)?.name ?? companyId}"`, 'Subscriptions');
    res.json({ message: 'Plan assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRevenueTrend = async (_req: Request, res: Response): Promise<void> => {
  try {
    const months = 6;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const agg = await Subscription.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const result: { month: string; revenue: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = agg.find((r: any) => r._id.year === year && r._id.month === month);
      result.push({
        month: d.toLocaleString('en-IN', { month: 'short' }),
        revenue: found?.revenue ?? 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const plan = await Plan.findById(id);
    if (!plan) { res.status(404).json({ message: 'Plan not found' }); return; }

    if ((plan as any).isActive === false) {
      res.status(400).json({ message: 'Plan is already deactivated' });
      return;
    }

    const now = new Date();
    const activeCount = await Subscription.countDocuments({
      plan: (plan as any).type,
      isActive: true,
      endDate: { $gt: now },
    });

    if (activeCount > 0) {
      const latest = await Subscription.findOne(
        { plan: (plan as any).type, isActive: true, endDate: { $gt: now } },
        { endDate: 1 },
      ).sort({ endDate: -1 });

      res.status(409).json({
        message: `This plan is currently assigned to ${activeCount} active company subscription(s). You can deactivate it once all subscriptions have expired.`,
        activeCount,
        latestExpiry: (latest as any)?.endDate,
      });
      return;
    }

    await Plan.findByIdAndUpdate(id, { isActive: false });
    await logActivity(req, `Deactivated plan "${(plan as any).name}"`, 'Subscriptions');
    res.json({ message: 'Plan deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { billingCycle, isActive, endDate } = req.body as { billingCycle?: string; isActive?: boolean; endDate?: string };

    const update: Record<string, unknown> = {};
    if (billingCycle) update.billingCycle = billingCycle;
    if (isActive !== undefined) update.isActive = isActive;
    if (endDate) update.endDate = new Date(endDate);

  const sub = await Subscription.findByIdAndUpdate(id, update, { returnDocument: 'after' }).populate('companyId', '_id name industry plan');
    const coName = (sub as any)?.companyId?.name ?? id;
    await logActivity(req, `Updated subscription for "${coName}"`, 'Subscriptions');
    res.json(sub);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
