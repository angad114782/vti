import { Request, Response } from 'express';
import Employee from '../models/Employee';
import SalaryStructure from '../models/SalaryStructure';
import Payslip from '../models/Payslip';
import User from '../models/User';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getSalaryStructures = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, employmentType } = req.query as Record<string, string>;

  const empWhere: Record<string, unknown> = { companyId };
  if (department && department !== 'ALL') empWhere.department = department;
  if (employmentType && employmentType !== 'ALL') empWhere.employmentType = employmentType;

  if (search) {
    const users = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
    empWhere.userId = { $in: users.map((u) => u._id) };
  }

  const employees = await Employee.find(empWhere).populate('userId', 'name').lean();

  const results = await Promise.all(
    employees.map(async (e) => {
      const latest = await SalaryStructure.findOne({ employeeId: e._id }).sort({ createdAt: -1 }).lean();
      const user = e.userId as unknown as { name: string } | null;
      return {
        id: e._id.toString(),
        employeeId: e.employeeId,
        name: user?.name ?? '',
        department: e.department,
        designation: e.designation,
        employmentType: e.employmentType,
        annualCtc: latest?.annualCtc ?? e.annualCtc,
        lastRevised: latest?.lastRevised,
      };
    }),
  );

  res.json(results);
};

export const getPayslips = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, month, year } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (month && month !== 'ALL') where.month = parseInt(month);
  if (year && year !== 'ALL') where.year = parseInt(year);

  if (search) {
    const users = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const payslips = await Payslip.find(where)
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
    .sort({ year: -1, month: -1 });

  res.json(payslips);
};
