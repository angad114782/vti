import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import SalaryStructure from '../models/SalaryStructure';
import Payslip from '../models/Payslip';
import Attendance from '../models/Attendance';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';

export const getSalaryStructures = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, employmentType } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `payroll:salaries:${companyId}:${JSON.stringify({ search, department, employmentType, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const empWhere: Record<string, unknown> = { companyId };
    if (department && department !== 'ALL') empWhere.department = department;
    if (employmentType && employmentType !== 'ALL') empWhere.employmentType = employmentType;

    if (search) {
      const users = await User.find({ name: escapeRegex(search) }).select('_id').lean();
      empWhere.userId = { $in: users.map((u) => u._id) };
    }

    const [employees, filteredTotal] = await Promise.all([
      Employee.find(empWhere).populate('userId', 'name').sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      Employee.countDocuments(empWhere),
    ]);

    const empIds = employees.map((e) => e._id);
    const latestSalaries = companyId
      ? await SalaryStructure.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: empIds } } },
          { $sort: { createdAt: -1 } },
          { $group: { _id: '$employeeId', annualCtc: { $first: '$annualCtc' }, lastRevised: { $first: '$lastRevised' } } },
        ])
      : [];

    const salaryMap: Record<string, { annualCtc?: number; lastRevised?: Date }> = {};
    latestSalaries.forEach((s) => { salaryMap[s._id.toString()] = { annualCtc: s.annualCtc, lastRevised: s.lastRevised }; });

    const results = employees.map((e) => {
      const user = e.userId as unknown as { name: string } | null;
      const sal = salaryMap[e._id.toString()];
      return {
        id: e._id.toString(),
        employeeId: e.employeeId,
        name: user?.name ?? '',
        department: e.department,
        designation: e.designation,
        employmentType: e.employmentType,
        annualCtc: sal?.annualCtc ?? e.annualCtc,
        lastRevised: sal?.lastRevised,
      };
    });

    return { results, pagination: paginationMeta(filteredTotal, page, limit) };
  }, 600);

  res.json(result);
};

export const getPayslips = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, month, year } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `payroll:payslips:${companyId}:${JSON.stringify({ search, month, year, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const where: Record<string, unknown> = { companyId };
    if (month && month !== 'ALL') where.month = parseInt(month);
    if (year && year !== 'ALL') where.year = parseInt(year);

    if (search) {
      const users = await User.find({ name: escapeRegex(search) }).select('_id').lean();
      const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
      where.employeeId = { $in: emps.map((e) => e._id) };
    }

    const [payslips, total] = await Promise.all([
      Payslip.find(where)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit),
      Payslip.countDocuments(where),
    ]);

    return { payslips, pagination: paginationMeta(total, page, limit) };
  }, 900);

  res.json(result);
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const runPayroll = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

  const { month, year, employeeIds } = req.body as { month: number; year: number; employeeIds?: string[] };
  if (!month || !year || month < 1 || month > 12) {
    res.status(400).json({ message: 'Valid month (1-12) and year are required' });
    return;
  }

  const empWhere: Record<string, unknown> = { companyId, status: 'Active' };
  if (employeeIds?.length) empWhere._id = { $in: employeeIds };

  const employees = await Employee.find(empWhere).lean();
  if (!employees.length) { res.status(404).json({ message: 'No active employees found for payroll run' }); return; }

  const empObjectIds = employees.map((e) => e._id);
  const latestSalaries = await SalaryStructure.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: empObjectIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$employeeId', annualCtc: { $first: '$annualCtc' } } },
  ]);
  const salaryMap: Record<string, number> = {};
  latestSalaries.forEach((s) => { salaryMap[s._id.toString()] = s.annualCtc; });

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const attendanceAgg = await Attendance.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        employeeId: { $in: empObjectIds },
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['Absent', 'Leave'] },
      },
    },
    { $group: { _id: '$employeeId', absentDays: { $sum: 1 } } },
  ]);
  const absentMap: Record<string, number> = {};
  attendanceAgg.forEach((a) => { absentMap[a._id.toString()] = a.absentDays; });

  const period = `${MONTH_NAMES[month - 1]} ${year}`;
  const created: unknown[] = [];
  const skipped: string[] = [];

  // Batch: pre-fetch all existing payslips for this period to avoid N+1
  const existingPayslips = await Payslip.find({
    companyId, employeeId: { $in: empObjectIds }, month, year,
  }).select('employeeId').lean();
  const existingSet = new Set(existingPayslips.map((p) => p.employeeId.toString()));
  let baseCount = await Payslip.countDocuments({ companyId });

  for (const emp of employees) {
    if (existingSet.has(emp._id.toString())) { skipped.push(emp.employeeId); continue; }

    const annualCtc = salaryMap[emp._id.toString()] ?? emp.annualCtc ?? 0;
    const grossSalary = Math.round(annualCtc / 12);
    const allowance = Math.round(grossSalary * 0.15);
    const grossWithAllowance = grossSalary + allowance;
    const absentDays = absentMap[emp._id.toString()] ?? 0;
    const dailyRate = grossWithAllowance / 26;
    const totalDeductions = Math.round(absentDays * dailyRate);
    const netPay = Math.max(0, grossWithAllowance - totalDeductions);

    baseCount++;
    const payslipId = `PS${year}${String(month).padStart(2, '0')}${String(baseCount).padStart(4, '0')}`;

    const payslip = await Payslip.create({
      payslipId,
      employeeId: emp._id,
      companyId,
      period,
      month,
      year,
      grossSalary: grossWithAllowance,
      totalDeductions,
      netPay,
      status: 'Paid',
    });
    created.push(payslip);
  }

  invalidatePrefix(`payroll:payslips:${companyId}`);
  invalidatePrefix(`payroll:salaries:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Ran payroll for ${period}: ${created.length} payslips created`, 'Payroll');
  res.status(201).json({
    message: `Payroll processed for ${period}`,
    period,
    month,
    year,
    created: created.length,
    skipped: skipped.length,
    skippedEmployeeIds: skipped,
  });
};
