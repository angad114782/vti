import { Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import Employee from '../models/Employee';
import User from '../models/User';
import LeaveRequest from '../models/LeaveRequest';
import Expense from '../models/Expense';
import Payslip from '../models/Payslip';
import Company from '../models/Company';
import CompanyModule from '../models/CompanyModule';
import ActivityLog from '../models/ActivityLog';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

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

    res.json({
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { search, role } = req.query as Record<string, string>;

    const where: Record<string, any> = { companyId };
    if (role && role !== 'ALL') where.role = role;
    if (search) {
      where.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const users: any[] = await User.find(where as any)
      .select('id name email role isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);
    const employees = await Employee.find({ userId: { $in: userIds }, companyId })
      .select('userId employeeId department designation')
      .lean();

    const empMap: Record<string, { employeeId: string; department?: string; designation?: string }> = {};
    employees.forEach((e) => { empMap[e.userId.toString()] = { employeeId: e.employeeId, department: e.department ?? undefined, designation: e.designation ?? undefined }; });

    res.json(users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      employee: empMap[u._id.toString()] ?? null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { name, email, role, password } = req.body as {
      name: string; email: string; role: string; password: string;
    };

    const exists = await User.findOne({ email });
    if (exists) { res.status(409).json({ message: 'Email already in use' }); return; }

    const hashed = await bcrypt.hash(password || `${name.split(' ')[0]!.toLowerCase()}@123`, 10);

    const user: any = await User.create({ name, email, password: hashed, role: role as any, companyId, isActive: true });

    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { role, isActive } = req.body as { role?: string; isActive?: boolean };

    const update: Record<string, unknown> = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('id name email role isActive');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await User.findByIdAndUpdate(id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) { res.json([]); return; }

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

    const result = allDepts
      .map((d: { _id: string; count: number }) => ({
        name: d._id,
        total: d.count,
        active: activeMap[d._id] ?? 0,
      }))
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
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
    const companyId = req.user!.companyId;
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
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const modules = await CompanyModule.find({ companyId })
      .populate('moduleId')
      .sort({ createdAt: 1 });
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
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
    const companyId = req.user!.companyId;
    const logs = await ActivityLog.find({ companyId })
      .populate('userId', 'name role')
      .sort({ createdAt: -1 })
      .limit(40);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
