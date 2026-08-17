import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import Employee from '../models/Employee';
import User from '../models/User';
import LeaveRequest from '../models/LeaveRequest';
import Expense from '../models/Expense';
import Payslip from '../models/Payslip';
import Company from '../models/Company';
import CompanyModule from '../models/CompanyModule';
import ActivityLog from '../models/ActivityLog';
import RolePermission from '../models/RolePermission';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';

const resolveCompanyId = (req: AuthRequest): string | undefined => {
  const tokenCompanyId = req.user?.companyId?.toString();
  const queryCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
  return tokenCompanyId || queryCompanyId;
};

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const result = await getCached(`ca:dashboard:${companyId}`, async () => {
      const [totalEmployees, activeEmployees, deptAgg, pendingLeaves, pendingExpenses, payslipsProcessed, users] = await Promise.all([
        Employee.countDocuments({ companyId }),
        Employee.countDocuments({ companyId, status: 'Active' }),
        Employee.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
        ]),
        LeaveRequest.countDocuments({ companyId, status: 'Pending' }),
        Expense.countDocuments({ companyId, status: 'Pending' }),
        Payslip.countDocuments({ companyId, status: 'Paid' }),
        User.find({ companyId }).select('role').lean(),
      ]);

      const roleDistribution = users.reduce((acc: Record<string, number>, u) => {
        const role = u.role as string;
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
      }, {});

      const deptBreakdown = deptAgg
        .map((d: { _id: string; count: number }) => ({ department: d._id, count: d.count }))
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

      return {
        stats: {
          totalEmployees,
          activeEmployees,
          departments: deptBreakdown.length,
          pendingLeaves,
          pendingExpenses,
          payslipsProcessed,
          totalUsers: users.length,
        },
        roleDistribution,
        deptBreakdown,
      };
    }, 300);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { search, role } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

    const cacheKey = `ca:users:${companyId}:${JSON.stringify({ search, role, page, limit })}`;

    const result = await getCached(cacheKey, async () => {
      const where: Record<string, any> = { companyId };
      if (role && role !== 'ALL') where.role = role;
      if (search) {
        const re = escapeRegex(search);
        where.$or = [{ name: re }, { email: re }];
      }

      const [users, total]: [any[], number] = await Promise.all([
        User.find(where as any)
          .select('id name email role isActive createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(where as any),
      ]);

      const userIds = users.map((u) => u._id);
      const employees = await Employee.find({ userId: { $in: userIds }, companyId })
        .select('userId employeeId department designation')
        .lean();

      const empMap: Record<string, { employeeId: string; department?: string; designation?: string }> = {};
      employees.forEach((e) => { empMap[e.userId.toString()] = { employeeId: e.employeeId, department: e.department ?? undefined, designation: e.designation ?? undefined }; });

      return {
        users: users.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          employee: empMap[u._id.toString()] ?? null,
        })),
        pagination: paginationMeta(total, page, limit),
      };
    }, 180);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { name, email, role, password } = req.body as {
      name: string; email: string; role: string; password: string;
    };

    const exists = await User.findOne({ email });
    if (exists) { res.status(409).json({ message: 'Email already in use' }); return; }

    const rawPassword = password || crypto.randomBytes(12).toString('base64url');
    const hashed = await bcrypt.hash(rawPassword, 10);

    const user: any = await User.create({ name, email, password: hashed, role: role as any, companyId, isActive: true });

    invalidatePrefix(`ca:users:${companyId}`);
    invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Created user "${name}" (${role})`, 'Users');
    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // Only included when auto-generated so admin can share it once
      ...(password ? {} : { generatedPassword: rawPassword }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { id } = req.params as { id: string };
    const { role, isActive } = req.body as { role?: string; isActive?: boolean };

    const target = await User.findById(id).lean();
    if (!target) { res.status(404).json({ message: 'User not found' }); return; }
    if (target.companyId?.toString() !== companyId) {
      res.status(403).json({ message: 'Forbidden' }); return;
    }

    const update: Record<string, unknown> = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('id name email role isActive');
    const changes = role ? `role → ${role}` : `isActive → ${isActive}`;
    invalidatePrefix(`ca:users:${companyId}`);
    invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Updated user "${(user as any)?.name ?? id}" (${changes})`, 'Users');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { id } = req.params as { id: string };

    const target = await User.findById(id).lean();
    if (!target) { res.status(404).json({ message: 'User not found' }); return; }
    if (target.companyId?.toString() !== companyId) {
      res.status(403).json({ message: 'Forbidden' }); return;
    }

    await User.findByIdAndUpdate(id, { isActive: false });
    invalidatePrefix(`ca:users:${companyId}`);
    invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Deactivated user "${target.name}"`, 'Users');
    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.json([]); return; }

    const result = await getCached(`ca:departments:${companyId}:detail`, async () => {
      const [allDepts, activeDepts] = await Promise.all([
        Employee.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
        ]),
        Employee.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), status: 'Active' } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
        ]),
      ]);

      const activeMap: Record<string, number> = {};
      activeDepts.forEach((d: { _id: string; count: number }) => { activeMap[d._id] = d.count; });

      return allDepts
        .map((d: { _id: string; count: number }) => ({
          name: d._id,
          total: d.count,
          active: activeMap[d._id] ?? 0,
        }))
        .sort((a: { total: number }, b: { total: number }) => b.total - a.total);
    }, 900);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const company = await Company.findById(companyId).lean();
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }

    const [subscription, modules] = await Promise.all([
      (await import('../models/Subscription')).default.findOne({ companyId }).lean(),
      CompanyModule.find({ companyId }).populate('moduleId').lean(),
    ]);

    res.json({
      ...company,
      id: company._id.toString(),
      _id: undefined,
      subscription,
      modules,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { name, industry, email, phone, address } = req.body as {
      name?: string; industry?: string; email?: string; phone?: string; address?: string;
    };

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (industry) update.industry = industry;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (address) update.address = address;

    const company = await Company.findByIdAndUpdate(companyId, update, { new: true });
    logActivity(req as any, `Updated company settings "${(company as any)?.name ?? companyId}"`, 'Settings');
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const modules = await CompanyModule.find({ companyId })
      .populate('moduleId')
      .sort({ createdAt: 1 })
      .lean();
    res.json(modules.map((m: any) => ({
      id: m._id.toString(),
      isEnabled: m.isEnabled,
      module: m.moduleId ? { id: m.moduleId._id?.toString() ?? m.moduleId.id, name: m.moduleId.name, description: m.moduleId.description ?? null } : null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { moduleId } = req.params as { moduleId: string };
    const { isEnabled } = req.body as { isEnabled: boolean };

    const result = await CompanyModule.updateMany({ companyId, moduleId }, { isEnabled });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>, 40, 100);
    const [logs, total] = await Promise.all([
      ActivityLog.find({ companyId })
        .populate('userId', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ companyId }),
    ]);
    res.json({ logs, pagination: paginationMeta(total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRolePermissions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const perms = await RolePermission.find().lean();
    res.json(perms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRolePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, permissions } = req.body as { role: string; permissions: Record<string, boolean> };
    if (!role || !permissions) { res.status(400).json({ message: 'role and permissions required' }); return; }

    const ops = Object.entries(permissions).map(([module, isGranted]) => ({
      updateOne: {
        filter: { role, module },
        update: { $set: { role, module, permission: module, isGranted } },
        upsert: true,
      },
    }));

    await RolePermission.bulkWrite(ops);
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
