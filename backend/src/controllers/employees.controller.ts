import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';

export const getEmployees = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, status } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `hr:employees:${companyId}:${JSON.stringify({ search, department, status, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const where: Record<string, unknown> = { companyId };
    if (department && department !== 'ALL') where.department = department;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      const re = escapeRegex(search);
      const matchingUsers = await User.find({ name: re }).select('_id').lean();
      where.$or = [
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { employeeId: re },
        { designation: re },
      ];
    }

    const [employees, filteredTotal, total, active] = await Promise.all([
      Employee.find(where)
        .populate('userId', 'id name email role')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(where),
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ companyId, status: 'Active' }),
    ]);

    const deptAgg = companyId ? await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$department' } },
    ]) : [];

    return {
      employees,
      pagination: paginationMeta(filteredTotal, page, limit),
      stats: { total, active, inactive: total - active, departments: deptAgg.length },
    };
  }, 300);

  res.json(result);
};

export const getEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const emp = await Employee.findById(id).populate('userId');
  if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }
  res.json(emp);
};

export const createEmployee = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { name, email, department, designation, shiftType, shiftTiming, joiningDate, annualCtc, employmentType, bankName, branchName, accountHolder } = req.body as Record<string, string>;

  if (!name || !email) { res.status(400).json({ message: 'Name and email required' }); return; }

  const existing = await User.findOne({ email });
  if (existing) { res.status(409).json({ message: 'A user with this email already exists' }); return; }

  const count = await Employee.countDocuments({ companyId });
  const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
  const generatedPassword = crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const user = await User.create({ email, password: hashedPassword, name, role: 'EMPLOYEE', companyId });

  const emp = await Employee.create({
    employeeId,
    userId: user._id,
    companyId,
    department,
    designation,
    shiftType,
    shiftTiming,
    joiningDate: joiningDate ? new Date(joiningDate) : null,
    annualCtc: annualCtc ? parseFloat(annualCtc) : null,
    employmentType: employmentType ?? 'Permanent',
    bankName,
    branchName,
    accountHolder,
  });

  const populated = await Employee.findById(emp._id).populate('userId', 'id name email role');
  invalidatePrefix(`hr:employees:${companyId}`);
  invalidatePrefix(`ca:departments:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Created employee ${name} (${employeeId})`, 'Employees');
  res.status(201).json({ ...((populated as any)?.toObject() ?? populated), generatedPassword });
};

export const updateEmployee = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const id = req.params.id as string;
  validateId(id);
  const { department, designation, shiftType, shiftTiming, annualCtc, status, bankName, branchName, accountHolder } = req.body as Record<string, string>;

  const target = await Employee.findById(id).lean();
  if (!target) { res.status(404).json({ message: 'Employee not found' }); return; }
  if (target.companyId?.toString() !== companyId) { res.status(403).json({ message: 'Forbidden' }); return; }

  const update: Record<string, unknown> = {};
  if (department) update.department = department;
  if (designation) update.designation = designation;
  if (shiftType) update.shiftType = shiftType;
  if (shiftTiming) update.shiftTiming = shiftTiming;
  if (annualCtc) update.annualCtc = parseFloat(annualCtc);
  if (status) update.status = status;
  if (bankName) update.bankName = bankName;
  if (branchName) update.branchName = branchName;
  if (accountHolder) update.accountHolder = accountHolder;

  const emp = await Employee.findByIdAndUpdate(id, update, { new: true }).populate('userId', 'id name email');
  const empName = (emp as any)?.userId?.name ?? target.employeeId;
  invalidatePrefix(`hr:employees:${companyId}`);
  invalidatePrefix(`ca:departments:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Updated employee ${empName}`, 'Employees');
  res.json(emp);
};

export const getDepartments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.json([]); return; }
  const result = await getCached(`ca:departments:${companyId}`, async () => {
    const depts = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
    ]);
    return depts.map((d: { _id: string; count: number }) => ({ name: d._id, count: d.count }));
  }, 900);
  res.json(result);
};
