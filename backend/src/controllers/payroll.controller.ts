import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getSalaryStructures = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, employmentType } = req.query as Record<string, string>;

  const empWhere: Record<string, unknown> = { companyId };
  if (department && department !== 'ALL') empWhere.department = department;
  if (employmentType && employmentType !== 'ALL') empWhere.employmentType = employmentType;
  if (search) empWhere.user = { name: { contains: search, mode: 'insensitive' } };

  const employees = await prisma.employee.findMany({
    where: empWhere,
    include: {
      user: { select: { name: true } },
      salaryStructure: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  res.json(employees.map((e) => ({
    id: e.id,
    employeeId: e.employeeId,
    name: e.user.name,
    department: e.department,
    designation: e.designation,
    employmentType: e.employmentType,
    annualCtc: e.salaryStructure[0]?.annualCtc ?? e.annualCtc,
    lastRevised: e.salaryStructure[0]?.lastRevised,
  })));
};

export const getPayslips = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, month, year } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (month && month !== 'ALL') where.month = parseInt(month);
  if (year && year !== 'ALL') where.year = parseInt(year);
  if (search) where.employee = { user: { name: { contains: search, mode: 'insensitive' } } };

  const payslips = await prisma.payslip.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  res.json(payslips);
};
