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
import RefreshToken from '../models/RefreshToken';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';
import { getCompanyReference } from '../utils/companyReference';
import Department from '../models/Department';

const resolveCompanyId = (req: AuthRequest): string | undefined => {
  const tokenCompanyId = req.user?.companyId?.toString();
  const queryCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
  // Tenant users are always bound to the company in their signed token.
  // Only Super Admin may select a company explicitly for support/administration.
  return req.user?.role === 'SUPER_ADMIN' ? queryCompanyId : tokenCompanyId;
};
const normalizeEmail = (value: string) => value.trim().toLowerCase();

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
        Payslip.countDocuments({ companyId, status: { $in: ['Finalized', 'Paid'] } }),
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
        where.$or = [{ nameSearch: re }, { emailSearch: re }];
      }

      const [users, total]: [any[], number] = await Promise.all([
        User.find(where as any)
          .select('id name email role isActive accountStatus lastLoginAt createdAt')
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
      employees.forEach((e) => { if (e.userId) empMap[e.userId.toString()] = { employeeId: e.employeeId, department: e.department ?? undefined, designation: e.designation ?? undefined }; });

      return {
        users: users.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          accountStatus: u.accountStatus ?? (u.isActive ? 'ACTIVE' : 'SUSPENDED'),
          lastLoginAt: u.lastLoginAt ?? null,
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
    const { name, role, password } = req.body as {
      name: string; email: string; role: string; password: string;
    };
    const email = normalizeEmail((req.body as { email: string }).email);

    const exists = await User.findOne({ email });
    if (exists) { res.status(409).json({ message: 'Email already in use' }); return; }

    const rawPassword = password || crypto.randomBytes(12).toString('base64url');
    const hashed = await bcrypt.hash(rawPassword, 10);

    const user: any = await User.create({ name: name.trim(), email, password: hashed, role: role as any, companyId, isActive: true });

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

    const target = await User.findOne({ _id: id, companyId }).lean();
    if (!target) { res.status(404).json({ message: 'User not found' }); return; }

    const update: Record<string, unknown> = {};
    if (role) { update.role = role; update.$inc = { sessionVersion: 1 }; }
    if (isActive !== undefined) { update.isActive = isActive; update.accountStatus = isActive ? 'ACTIVE' : 'SUSPENDED'; update.$inc = { sessionVersion: 1 }; }

  const user = await User.findOneAndUpdate({ _id: id, companyId }, update, { returnDocument: 'after' }).select('id name email role isActive');
    if (isActive === false || role) await RefreshToken.deleteMany({ userId: id });
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

    const target = await User.findOne({ _id: id, companyId }).lean();
    if (!target) { res.status(404).json({ message: 'User not found' }); return; }

    await User.findOneAndUpdate({ _id: id, companyId }, { $set: { isActive: false }, $inc: { sessionVersion: 1 } });
    await RefreshToken.deleteMany({ userId: id });
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
      const [masters, allDepts, activeDepts] = await Promise.all([
        Department.find({ companyId }).sort({ name: 1 }).lean(),
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

      const countMap: Record<string, number> = {};
      allDepts.forEach((d: { _id: string; count: number }) => { countMap[d._id] = d.count; });
      return masters.map((d: any) => ({ id: d._id.toString(), name: d.name, code: d.code, isActive: d.isActive, total: countMap[d.name] ?? 0, active: activeMap[d.name] ?? 0 }));
    }, 900);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req); if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const name = String(req.body.name ?? '').trim(); const code = String(req.body.code ?? '').trim().toUpperCase();
    if (!name || !code) { res.status(400).json({ message: 'Department name and code are required' }); return; }
    const department = await Department.create({ companyId, name, code, isActive: true });
    invalidatePrefix(`ca:departments:${companyId}`); invalidatePrefix(`hr:employees:${companyId}`); invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Created department ${name}`, 'Departments'); res.status(201).json(department);
  } catch (err: any) { res.status(err?.code === 11000 ? 409 : 500).json({ message: err?.code === 11000 ? 'A department with this name or code already exists' : 'Internal server error' }); }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req); if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const department = await Department.findOne({ _id: req.params.id, companyId });
    if (!department) { res.status(404).json({ message: 'Department not found' }); return; }
    const nextName = req.body.name === undefined ? department.name : String(req.body.name).trim();
    const nextActive = req.body.isActive === undefined ? department.isActive : Boolean(req.body.isActive);
    const employeeScope = { companyId, $or: [{ departmentId: department._id }, { department: department.name }] };
    const headcount = await Employee.countDocuments(employeeScope);
    if (!nextActive && headcount > 0) { res.status(409).json({ message: 'Reassign all employees before deactivating this department', headcount }); return; }
    if (!nextName) { res.status(400).json({ message: 'Department name is required' }); return; }
    if (nextName !== department.name) await Employee.updateMany(employeeScope, { $set: { department: nextName, departmentId: department._id } });
    department.name = nextName; department.isActive = nextActive; await department.save();
    invalidatePrefix(`ca:departments:${companyId}`); invalidatePrefix(`hr:employees:${companyId}`); invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Updated department ${department.name}`, 'Departments'); res.json(department);
  } catch (err: any) { res.status(err?.code === 11000 ? 409 : 500).json({ message: err?.code === 11000 ? 'Department name already exists' : 'Internal server error' }); }
};

export const provisionEmployeeAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req); if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }
    const employee: any = await Employee.findOne({ _id: req.params.id, companyId });
    if (!employee) { res.status(404).json({ message: 'Employee not found' }); return; }
    if (employee.userId) { res.status(409).json({ message: 'This employee already has an account' }); return; }
    const email = String(req.body.email ?? employee.email ?? '').trim().toLowerCase();
    if (!email) { res.status(400).json({ message: 'An email is required to provision access' }); return; }
    if (await User.findOne({ email })) { res.status(409).json({ message: 'Email already belongs to another account' }); return; }
    const rawPassword = crypto.randomBytes(12).toString('base64url');
    const user: any = await User.create({ companyId, name: employee.name, email, password: await bcrypt.hash(rawPassword, 10), role: req.body.role || 'EMPLOYEE', accountStatus: 'INVITED', isActive: true });
    employee.userId = user._id; employee.email = email; await employee.save();
    invalidatePrefix(`ca:users:${companyId}`); invalidatePrefix(`hr:employees:${companyId}`); invalidate(`ca:dashboard:${companyId}`);
    logActivity(req as any, `Provisioned account for ${employee.name}`, 'Users');
    res.status(201).json({ id: user._id.toString(), email, role: user.role, accountStatus: user.accountStatus, generatedPassword: rawPassword });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error' }); }
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
      companyCode: getCompanyReference(company._id, (company as any).companyCode),
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
    const { name, industry, email, phone, address, timezone } = req.body as {
      name?: string; industry?: string; email?: string; phone?: string; address?: string; timezone?: string;
    };

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (industry) update.industry = industry;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (address) update.address = address;
    if (timezone) update.timezone = timezone;

    const company = await Company.findByIdAndUpdate(companyId, update, { returnDocument: 'after' });
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

export const getRolePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);
    const scopedCompanyId = companyId ? new mongoose.Types.ObjectId(companyId) : undefined;
    let perms = scopedCompanyId
      ? await RolePermission.find({ companyId: scopedCompanyId }).lean()
      : await RolePermission.find({ companyId: { $exists: false } }).lean();
    if (companyId && !perms.length) perms = await RolePermission.find({ companyId: { $exists: false } }).lean();
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
    const companyId = resolveCompanyId(req);
    const scopedCompanyId = companyId ? new mongoose.Types.ObjectId(companyId) : undefined;

    const ops = Object.entries(permissions).map(([module, isGranted]) => ({
      updateOne: {
        filter: { ...(scopedCompanyId ? { companyId: scopedCompanyId } : { companyId: { $exists: false } }), role, module },
        update: { $set: { ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}), role, module, permission: module, isGranted } },
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
