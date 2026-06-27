import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getEmployees = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, status } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (department && department !== 'ALL') where.department = department;
  if (status && status !== 'ALL') where.status = status;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { employeeId: { contains: search, mode: 'insensitive' } },
      { designation: { contains: search, mode: 'insensitive' } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const total = await prisma.employee.count({ where: { companyId } });
  const active = await prisma.employee.count({ where: { companyId, status: 'Active' } });
  const departments = await prisma.employee.groupBy({ by: ['department'], where: { companyId }, _count: { id: true } });

  res.json({ employees, stats: { total, active, inactive: total - active, departments: departments.length } });
};

export const getEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }
  res.json(emp);
};

export const createEmployee = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { name, email, department, designation, shiftType, shiftTiming, joiningDate, annualCtc, employmentType, bankName, branchName, accountHolder } = req.body as Record<string, string>;

  if (!name || !email) { res.status(400).json({ message: 'Name and email required' }); return; }

  const count = await prisma.employee.count({ where: { companyId } });
  const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
  const password = await bcrypt.hash('emp@123', 10);

  const user = await prisma.user.create({
    data: { email, password, name, role: 'EMPLOYEE', companyId },
  });

  const emp = await prisma.employee.create({
    data: {
      employeeId, userId: user.id, companyId: companyId!,
      department, designation, shiftType, shiftTiming,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      annualCtc: annualCtc ? parseFloat(annualCtc) : null,
      employmentType: employmentType ?? 'Permanent',
      bankName, branchName, accountHolder,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.status(201).json(emp);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { department, designation, shiftType, shiftTiming, annualCtc, status, bankName, branchName, accountHolder } = req.body as Record<string, string>;

  const emp = await prisma.employee.update({
    where: { id },
    data: {
      ...(department && { department }),
      ...(designation && { designation }),
      ...(shiftType && { shiftType }),
      ...(shiftTiming && { shiftTiming }),
      ...(annualCtc && { annualCtc: parseFloat(annualCtc) }),
      ...(status && { status }),
      ...(bankName && { bankName }),
      ...(branchName && { branchName }),
      ...(accountHolder && { accountHolder }),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.json(emp);
};

export const getDepartments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const depts = await prisma.employee.groupBy({ by: ['department'], where: { companyId: companyId ?? undefined }, _count: { id: true } });
  res.json(depts.filter((d) => d.department).map((d) => ({ name: d.department!, count: d._count.id })));
};
