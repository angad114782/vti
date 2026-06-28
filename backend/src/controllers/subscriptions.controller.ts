import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import Company from '../models/Company';

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, billing, status, page = '1', limit = '8' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subWhere: Record<string, unknown> = {};
    if (status && status !== 'ALL') subWhere.isActive = status === 'ACTIVE';
    if (billing && billing !== 'ALL') subWhere.billingCycle = billing;
    if (plan && plan !== 'ALL') subWhere.plan = plan;

    let companyIds: string[] | null = null;
    if (search) {
      const companies = await Company.find({
        $or: [{ name: new RegExp(search, 'i') }, { industry: new RegExp(search, 'i') }],
      }).select('_id').lean();
      companyIds = companies.map((c) => c._id.toString());
      subWhere.companyId = { $in: companyIds };
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(subWhere)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('companyId', 'id name industry plan'),
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

    res.json({
      subscriptions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
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
        $set: { plan, billingCycle: billingCycle ?? 'Monthly', amount: planData.get('price'), endDate, isActive: true },
        $setOnInsert: { companyId, startDate: new Date() },
      },
      { upsert: true, new: true },
    );

    await Company.findByIdAndUpdate(companyId, {
      plan,
      status: 'ACTIVE',
      planExpiry: endDate,
      maxUsers: planData.get('maxUsers'),
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

    const update: Record<string, unknown> = {};
    if (billingCycle) update.billingCycle = billingCycle;
    if (isActive !== undefined) update.isActive = isActive;
    if (endDate) update.endDate = new Date(endDate);

    const sub = await Subscription.findByIdAndUpdate(id, update, { new: true }).populate('companyId', 'id name');
    res.json(sub);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
