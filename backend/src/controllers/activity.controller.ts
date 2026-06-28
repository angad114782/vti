import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Company from '../models/Company';
import User from '../models/User';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type = 'activity',
      search, company, role, action, module, status,
      page = '1', limit = '10',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};

    if (type === 'login') where.action = 'Logged In';
    if (company && company !== 'ALL') where.companyId = company;
    if (action && action !== 'ALL') where.action = new RegExp(action, 'i');
    if (module && module !== 'ALL') where.module = module;
    if (status && status !== 'ALL') where.status = status;

    if (role && role !== 'ALL') {
      const users = await User.find({ role: role as any }).select('_id').lean();
      where.userId = { $in: users.map((u) => u._id) };
    }

    if (search) {
      const [users, companies] = await Promise.all([
        User.find({ name: new RegExp(search, 'i') }).select('_id').lean(),
        Company.find({ name: new RegExp(search, 'i') }).select('_id').lean(),
      ]);
      where.$or = [
        { userId: { $in: users.map((u) => u._id) } },
        { companyId: { $in: companies.map((c) => c._id) } },
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(where)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('userId', 'id name email role')
        .populate('companyId', 'id name'),
      ActivityLog.countDocuments(where),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, successLogs, failedLogs] = await Promise.all([
      ActivityLog.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.countDocuments({ status: 'Success' }),
      ActivityLog.countDocuments({ status: 'Failed' }),
    ]);

    res.json({
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      stats: { total: totalLogs, today: todayLogs, success: successLogs, failed: failedLogs },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompaniesFilter = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await Company.find().select('id name').sort({ name: 1 });
    res.json(companies);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
