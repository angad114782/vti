import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Company from '../models/Company';
import User from '../models/User';
import { escapeRegex, clampLimit } from '../utils/query';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type = 'activity',
      search, company, role, action, module, status,
      page = '1',
    } = req.query as Record<string, string>;

    const limit = clampLimit(req.query.limit as string | undefined);
    const skip = (parseInt(page) - 1) * limit;
    const where: Record<string, unknown> = {};

    if (type === 'login') {
      where.action = 'Logged In';
    } else {
      where.action = { $ne: 'Logged In' };
    }
    if (company && company !== 'ALL') where.companyId = company;
    if (action && action !== 'ALL') where.action = escapeRegex(action);
    if (module && module !== 'ALL') where.module = module;
    if (status && status !== 'ALL') where.status = status;

    if (role && role !== 'ALL') {
      const users = await User.find({ role: role as any }).select('_id').lean();
      where.userId = { $in: users.map((u) => u._id) };
    }

    if (search) {
      const re = escapeRegex(search);
      const [users, companies] = await Promise.all([
        User.find({ name: re }).select('_id').lean(),
        Company.find({ name: re }).select('_id').lean(),
      ]);
      where.$or = [
        { userId: { $in: users.map((u) => u._id) } },
        { companyId: { $in: companies.map((c) => c._id) } },
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(where)
        .skip(skip)
        .limit(limit)
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

    const logsOut = logs.map((log: any) => {
      const obj = log.toObject ? log.toObject() : log;
      return {
        id: obj._id?.toString() ?? obj.id,
        action: obj.action,
        module: obj.module,
        status: obj.status,
        ipAddress: obj.ipAddress,
        userAgent: obj.userAgent,
        createdAt: obj.createdAt,
        user: obj.userId ? {
          id: obj.userId._id?.toString() ?? obj.userId.id,
          name: obj.userId.name,
          email: obj.userId.email,
          role: obj.userId.role,
        } : null,
        company: obj.companyId ? {
          id: obj.companyId._id?.toString() ?? obj.companyId.id,
          name: obj.companyId.name,
        } : null,
      };
    });

    res.json({
      logs: logsOut,
      pagination: { total, page: parseInt(page), limit, totalPages: Math.ceil(total / limit) },
      stats: { total: totalLogs, today: todayLogs, success: successLogs, failed: failedLogs },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompaniesFilter = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({ isDeleted: { $ne: true } }).select('id name').sort({ name: 1 });
    res.json(companies);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
