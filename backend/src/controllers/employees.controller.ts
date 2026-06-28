import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';
import User from '../models/User';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getEmployees = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, status } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (department && department !== 'ALL') where.department = department;
  if (status && status !== 'ALL') where.status = status;

  if (search) {
    const matchingUsers = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
    where.$or = [
      { userId: { $in: matchingUsers.map((u) => u._id) } },
      { employeeId: new RegExp(search, 'i') },
      { designation: new RegExp(search, 'i') },
    ];
  }

  const employees = await Employee.find(where)
    .populate('userId', 'id name email role')
    .sort({ createdAt: 1 });

  const total = await Employee.countDocuments({ companyId });
  const active = await Employee.countDocuments({ companyId, status: 'Active' });

  const deptAgg = companyId ? await Employee.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    { $group: { _id: '$department' } },
  ]) : [];

  res.json({ employees, stats: { total, active, inactive: total - active, departments: deptAgg.length } });
};

export const getEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const emp = await Employee.findById(id).populate('userId');
  if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }
  res.json(emp);
};

export const createEmployee = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { name, email, department, designation, shiftType, shiftTiming, joiningDate, annualCtc, employmentType, bankName, branchName, accountHolder } = req.body as Record<string, string>;

  if (!name || !email) { res.status(400).json({ message: 'Name and email required' }); return; }

  const count = await Employee.countDocuments({ companyId });
  const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
  const password = await bcrypt.hash('emp@123', 10);

  const user = await User.create({ email, password, name, role: 'EMPLOYEE', companyId });

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
  res.status(201).json(populated);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { department, designation, shiftType, shiftTiming, annualCtc, status, bankName, branchName, accountHolder } = req.body as Record<string, string>;

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
  res.json(emp);
};

export const getDepartments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.json([]); return; }
  const depts = await Employee.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
  ]);
  res.json(depts.map((d: { _id: string; count: number }) => ({ name: d._id, count: d.count })));
};
