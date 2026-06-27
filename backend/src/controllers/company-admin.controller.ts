import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// GET /api/company-admin/dashboard
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;

    const [totalEmployees, activeEmployees, departments, leaves, expenses, payslips, users] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId, status: 'Active' } }),
      prisma.employee.groupBy({ by: ['department'], where: { companyId }, _count: { id: true } }),
      prisma.leaveRequest.count({ where: { companyId, status: 'Pending' } }),
      prisma.expense.count({ where: { companyId, status: 'Pending' } }),
      prisma.payslip.count({ where: { companyId, status: 'Paid' } }),
      prisma.user.findMany({ where: { companyId }, select: { role: true } }),
    ]);

    const roleDistribution = users.reduce((acc: Record<string, number>, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});

    const deptBreakdown = departments
      .filter((d) => d.department)
      .map((d) => ({ department: d.department!, count: d._count.id }))
      .sort((a, b) => b.count - a.count);

    res.json({
      stats: {
        totalEmployees,
        activeEmployees,
        departments: deptBreakdown.length,
        pendingLeaves: leaves,
        pendingExpenses: expenses,
        payslipsProcessed: payslips,
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

// GET /api/company-admin/users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { search, role } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { companyId };
    if (role && role !== 'ALL') where.role = role;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        employee: { select: { employeeId: true, department: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/company-admin/users
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { name, email, role, password } = req.body as {
      name: string; email: string; role: string; password: string;
    };

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { res.status(409).json({ message: 'Email already in use' }); return; }

    const hashed = await bcrypt.hash(password || `${name.split(' ')[0]!.toLowerCase()}@123`, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role as never, companyId, isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/company-admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { role, isActive } = req.body as { role?: string; isActive?: boolean };

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role: role as never } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/company-admin/users/:id
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/company-admin/departments
export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const depts = await prisma.employee.groupBy({
      by: ['department'],
      where: { companyId },
      _count: { id: true },
    });
    const active = await prisma.employee.groupBy({
      by: ['department'],
      where: { companyId, status: 'Active' },
      _count: { id: true },
    });

    const activeMap: Record<string, number> = {};
    active.forEach((d) => { if (d.department) activeMap[d.department] = d._count.id; });

    const result = depts
      .filter((d) => d.department)
      .map((d) => ({
        name:   d.department!,
        total:  d._count.id,
        active: activeMap[d.department!] ?? 0,
      }))
      .sort((a, b) => b.total - a.total);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/company-admin/company
export const getCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true, modules: { include: { module: true } } },
    });
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/company-admin/company
export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { name, industry, email, phone, address } = req.body as {
      name?: string; industry?: string; email?: string; phone?: string; address?: string;
    };
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { ...(name && { name }), ...(industry && { industry }), ...(email && { email }), ...(phone && { phone }), ...(address && { address }) },
    });
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/company-admin/modules
export const getModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const modules = await prisma.companyModule.findMany({
      where: { companyId },
      include: { module: true },
      orderBy: { module: { name: 'asc' } },
    });
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/company-admin/modules/:moduleId
export const toggleModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { moduleId } = req.params as { moduleId: string };
    const { isEnabled } = req.body as { isEnabled: boolean };

    const cm = await prisma.companyModule.updateMany({
      where: { companyId, moduleId },
      data: { isEnabled },
    });

    res.json({ updated: cm.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/company-admin/activity
export const getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const logs = await prisma.activityLog.findMany({
      where: { companyId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
